package com.antonkuznetsov.taro.vision

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.util.Base64
import ai.onnxruntime.OnnxTensor
import ai.onnxruntime.OrtEnvironment
import ai.onnxruntime.OrtSession
import com.facebook.react.bridge.*
import com.google.mediapipe.framework.image.BitmapImageBuilder
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.handlandmarker.HandLandmarker
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.concurrent.Executors
import java.io.File
import kotlin.math.roundToInt

/** Models and photos stay on the device. One worker owns both inference sessions. */
class TaroVisionModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    private val worker = Executors.newSingleThreadExecutor()
    private var hands: HandLandmarker? = null
    private var net: OrtSession? = null
    private val env by lazy { OrtEnvironment.getEnvironment() }

    override fun getName() = "TaroVision"

    private fun handDetector(): HandLandmarker = hands ?: HandLandmarker.createFromOptions(context,
        HandLandmarker.HandLandmarkerOptions.builder()
            .setBaseOptions(BaseOptions.builder().setModelAssetPath("hand_landmarker.task").build())
            .setRunningMode(RunningMode.IMAGE).setNumHands(1)
            .setMinHandDetectionConfidence(0.5f).build()
    ).also { hands = it }

    private fun lineNet(): OrtSession = net ?: OrtSession.SessionOptions().use { options ->
        options.setIntraOpNumThreads(2)
        options.setInterOpNumThreads(1)
        env.createSession(context.assets.open("palm_lines.onnx").use { it.readBytes() }, options)
    }.also { net = it }

    @ReactMethod fun preload(promise: Promise) {
        worker.execute {
            try { handDetector(); lineNet(); promise.resolve(true) }
            catch (error: Exception) { promise.reject("load_failed", "Не удалось подготовить распознавание", error) }
        }
    }

    @ReactMethod fun detect(uri: String, promise: Promise) {
        worker.execute {
            var bitmap: Bitmap? = null
            try {
                bitmap = context.contentResolver.openInputStream(Uri.parse(uri)).use { stream -> BitmapFactory.decodeStream(stream) }
                    ?: throw IllegalArgumentException("Cannot read photo")
                val scale = minOf(1.0, 1000.0 / maxOf(bitmap.width, bitmap.height))
                if (scale < 1) {
                    val smaller = Bitmap.createScaledBitmap(bitmap, (bitmap.width * scale).roundToInt(), (bitmap.height * scale).roundToInt(), true)
                    bitmap.recycle()
                    bitmap = smaller
                }
                val image = BitmapImageBuilder(bitmap).build()
                val result = try { handDetector().detect(image) } catch (error: Exception) { image.close(); throw error }
                val out = Arguments.createMap()
                out.putInt("width", bitmap.width)
                out.putInt("height", bitmap.height)
                val points = Arguments.createArray()
                val hand = result.landmarks().firstOrNull()
                hand?.forEach { point ->
                    points.pushMap(Arguments.createMap().apply { putDouble("x", point.x().toDouble()); putDouble("y", point.y().toDouble()) })
                }
                out.putArray("landmarks", points)
                result.handednesses().firstOrNull()?.firstOrNull()?.let { category ->
                    out.putString("hand", category.categoryName())
                    out.putDouble("confidence", category.score().toDouble())
                }
                // putArray transfers ownership to the map; do not inspect the
                // consumed WritableNativeArray to decide whether to copy pixels.
                if (hand?.size == 21) {
                    val pixels = IntArray(bitmap.width * bitmap.height)
                    bitmap.getPixels(pixels, 0, bitmap.width, 0, 0, bitmap.width, bitmap.height)
                    val bytes = ByteArray(pixels.size * 4)
                    pixels.forEachIndexed { i, color ->
                        bytes[i * 4] = (color shr 16).toByte(); bytes[i * 4 + 1] = (color shr 8).toByte()
                        bytes[i * 4 + 2] = color.toByte(); bytes[i * 4 + 3] = 255.toByte()
                    }
                    out.putString("rgba", Base64.encodeToString(bytes, Base64.NO_WRAP))
                    out.putString("enhancedUri", enhance(bitmap, pixels))
                }
                image.close()
                promise.resolve(out)
            } catch (error: Exception) { promise.reject("image_failed", "Не удалось обработать фото", error) }
            finally { bitmap?.recycle() }
        }
    }

    private fun enhance(bitmap: Bitmap, pixels: IntArray): String {
        val w = bitmap.width; val h = bitmap.height
        val gray = DoubleArray(w * h) { i -> .25 * (pixels[i] shr 16 and 255) + .6 * (pixels[i] shr 8 and 255) + .15 * (pixels[i] and 255) }
        val integral = DoubleArray((w + 1) * (h + 1))
        for (y in 0 until h) {
            var row = 0.0
            for (x in 0 until w) { row += gray[y * w + x]; integral[(y + 1) * (w + 1) + x + 1] = row + integral[y * (w + 1) + x + 1] }
        }
        val radius = maxOf(4, w / 65)
        val output = IntArray(w * h)
        for (y in 0 until h) for (x in 0 until w) {
            val x0 = maxOf(0, x - radius); val x1 = minOf(w, x + radius + 1)
            val y0 = maxOf(0, y - radius); val y1 = minOf(h, y + radius + 1)
            val sum = integral[y1 * (w + 1) + x1] - integral[y0 * (w + 1) + x1] - integral[y1 * (w + 1) + x0] + integral[y0 * (w + 1) + x0]
            val bg = sum / ((x1 - x0) * (y1 - y0))
            val v = (195 + (gray[y * w + x] / maxOf(1.0, bg) - 1) * 750).roundToInt().coerceIn(0, 255)
            output[y * w + x] = (255 shl 24) or (minOf(255, v + 18) shl 16) or (v shl 8) or maxOf(0, v - 12)
        }
        val enhanced = Bitmap.createBitmap(output, w, h, Bitmap.Config.ARGB_8888)
        val file = File(context.cacheDir, "palm-contrast-${System.nanoTime()}.jpg")
        file.outputStream().use { enhanced.compress(Bitmap.CompressFormat.JPEG, 90, it) }
        enhanced.recycle()
        return Uri.fromFile(file).toString()
    }

    @ReactMethod fun infer(input: String, promise: Promise) {
        worker.execute {
            try {
                val bytes = Base64.decode(input, Base64.DEFAULT)
                require(bytes.size == 3 * 256 * 256 * 4) { "Invalid tensor" }
                val floats = ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN).asFloatBuffer()
                OnnxTensor.createTensor(env, floats, longArrayOf(1, 3, 256, 256)).use { tensor ->
                    lineNet().run(mapOf("image" to tensor)).use { result ->
                        val output = result.get("logits").get() as OnnxTensor
                        val data = output.floatBuffer
                        val buffer = ByteBuffer.allocate(data.remaining() * 4).order(ByteOrder.LITTLE_ENDIAN)
                        while (data.hasRemaining()) {
                            val value = data.get().toDouble()
                            buffer.putFloat((1.0 / (1.0 + Math.exp(-value))).toFloat())
                        }
                        promise.resolve(Base64.encodeToString(buffer.array(), Base64.NO_WRAP))
                    }
                }
            } catch (error: Exception) { promise.reject("inference_failed", "Не удалось найти линии ладони", error) }
        }
    }

    override fun invalidate() {
        worker.execute { hands?.close(); net?.close(); hands = null; net = null }
        worker.shutdown()
        super.invalidate()
    }
}
