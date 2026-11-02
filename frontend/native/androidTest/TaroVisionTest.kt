package com.antonkuznetsov.taro.vision

import android.net.Uri
import android.util.Base64
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.facebook.react.bridge.*
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicReference
import android.view.accessibility.AccessibilityNodeInfo
import expo.modules.notifications.notifications.model.NotificationContent
import expo.modules.notifications.notifications.model.NotificationRequest
import expo.modules.notifications.notifications.triggers.DailyTrigger
import expo.modules.notifications.service.delegates.ExpoSchedulingDelegate
import org.json.JSONObject

/** Tests the real release APK, JNI libraries, models, and native bridge on Android. */
@RunWith(AndroidJUnit4::class)
class TaroVisionTest {
    private val instrumentation = InstrumentationRegistry.getInstrumentation()
    private val context: ReactApplicationContext by lazy {
        val launch = instrumentation.targetContext.packageManager.getLaunchIntentForPackage(instrumentation.targetContext.packageName)!!
        instrumentation.startActivitySync(launch)
        val app = instrumentation.targetContext.applicationContext as com.antonkuznetsov.taro.MainApplication
        var found: ReactApplicationContext? = null
        for (attempt in 0 until 300) {
            found = app.reactHost.currentReactContext as? ReactApplicationContext
            if (found != null) break
            Thread.sleep(100)
        }
        found ?: throw AssertionError("React Native did not start")
    }

    private fun awaitResult(call: (Promise) -> Unit): Any? {
        val result = AtomicReference<Any?>()
        val failure = AtomicReference<Any?>()
        val done = CountDownLatch(1)
        val promise = PromiseImpl(
            Callback { args -> result.set(args.firstOrNull()); done.countDown() },
            Callback { args -> failure.set(args.firstOrNull()); done.countDown() }
        )
        call(promise)
        assertTrue("Native inference timed out", done.await(90, TimeUnit.SECONDS))
        assertNull("Native bridge rejected the request: ${failure.get()}", failure.get())
        return result.get()
    }

    @Test fun bundledModelsLoadOfflineAndRunLineInference() {
        val module = TaroVisionModule(context)
        try {
            assertEquals(true, awaitResult { module.preload(it) })
            val input = Base64.encodeToString(ByteArray(3 * 256 * 256 * 4), Base64.NO_WRAP)
            val output = Base64.decode(awaitResult { module.infer(input, it) } as String, Base64.DEFAULT)
            assertEquals(256 * 256 * 4, output.size)
            val values = ByteBuffer.wrap(output).order(ByteOrder.LITTLE_ENDIAN).asFloatBuffer()
            while (values.hasRemaining()) { val v = values.get(); assertTrue("Invalid probability", v.isFinite() && v in 0f..1f) }
        } finally { module.invalidate() }
    }

    @Test fun mediaPipeFindsRealHandAndReturnsMatchingPixels() {
        val file = File(context.cacheDir, "hand-test.jpg")
        instrumentation.context.assets.open("hand.jpg").use { input -> file.outputStream().use { input.copyTo(it) } }
        val module = TaroVisionModule(context)
        try {
            val result = awaitResult { module.detect(Uri.fromFile(file).toString(), it) } as ReadableMap
            assertEquals(21, result.getArray("landmarks")!!.size())
            val width = result.getInt("width"); val height = result.getInt("height")
            assertTrue(width > 0 && height > 0)
            assertEquals(width * height * 4, Base64.decode(result.getString("rgba"), Base64.DEFAULT).size)
            assertTrue(File(Uri.parse(result.getString("enhancedUri")).path!!).exists())
        } finally { module.invalidate(); file.delete() }
    }

    @Test fun nativeLaunchDisplaysAUserScreen() {
        context // Start the real release activity and its React Native host.
        fun labels(node: AccessibilityNodeInfo?): List<String> {
            if (node == null) return emptyList()
            return listOfNotNull(node.text?.toString(), node.contentDescription?.toString()) +
                (0 until node.childCount).flatMap { labels(node.getChild(it)) }
        }
        var last = emptyList<String>()
        for (attempt in 0 until 100) {
            last = labels(instrumentation.uiAutomation.rootInActiveWindow)
            assertFalse("The release app displayed its error screen", last.any { it.contains("Что-то пошло не так") })
            if (last.any { it.contains("Добро пожаловать в Таро") || it.contains("Мистические практики") }) return
            Thread.sleep(200)
        }
        fail("The app did not display a user screen: $last")
    }

    @Test fun dailyReminderSurvivesReleaseSerializationWithoutDuplicates() {
        val scheduler = ExpoSchedulingDelegate(context)
        val id = "taro-instrumentation-reminder"
        val content = NotificationContent.Builder()
            .setTitle("Карта дня")
            .setText("Проверка напоминания")
            .setBody(JSONObject().put("screen", "/"))
            .build()
        val request = NotificationRequest(id, content, DailyTrigger("taro-daily-card", 9, 0))
        try {
            scheduler.scheduleNotification(request)
            scheduler.scheduleNotification(request)
            val stored = scheduler.getScheduledNotification(id)!!
            assertEquals(id, stored.identifier)
            assertEquals("/", (stored.content as NotificationContent).body!!.getString("screen"))
            assertEquals(9, (stored.trigger as DailyTrigger).hour)
            assertEquals(1, scheduler.getAllScheduledNotifications().count { it.identifier == id })
        } finally { scheduler.removeScheduledNotifications(listOf(id)) }
    }
}
