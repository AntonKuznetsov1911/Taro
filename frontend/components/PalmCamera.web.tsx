import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent } from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { CapturedPalmPhoto, PalmCameraProps } from './palmCameraTypes';

/**
 * Веб-реализация камеры ладони.
 *
 * expo-camera на вебе полагается на navigator.permissions.query({ name: 'camera' }):
 * если браузер не поддерживает этот запрос (Android WebView, часть мобильных браузеров),
 * промис отклоняется и экран навсегда застревает на спиннере. Кроме того, expo-camera
 * не останавливает предыдущий поток при смене камеры, а на Android две камеры
 * одновременно открыть нельзя — переключение падает с NotReadableError.
 *
 * Поэтому на вебе работаем с getUserMedia напрямую: <video> для превью,
 * <canvas> для снимка, явная остановка потока перед каждым перезапуском.
 */

type Facing = 'back' | 'front';
type Status = 'starting' | 'ready' | 'error';
type ErrorKind = 'unsupported' | 'denied' | 'notfound' | 'busy' | 'unknown';

/** Максимальная сторона готового снимка — держим файл небольшим. */
const MAX_OUTPUT_SIZE = 1280;
const JPEG_QUALITY = 0.9;
/** Видоискатель и снимок — 3:4: в кадр помещается ладонь с пальцами */
const FRAME_ASPECT = 3 / 4;

const ERROR_MESSAGES: Record<ErrorKind, { title: string; text: string }> = {
  unsupported: {
    title: 'Камера недоступна в этом браузере',
    text:
      'Браузер не разрешает доступ к камере. Обычно это происходит, если страница открыта не по защищённому адресу (https). ' +
      'Откройте сайт в Chrome или Safari по адресу с https — либо выберите готовое фото ладони из галереи.',
  },
  denied: {
    title: 'Доступ к камере запрещён',
    text:
      'Разрешите камеру для этого сайта: нажмите на значок замка (или ⓘ) слева от адреса, откройте «Настройки сайта» → «Камера» → «Разрешить», ' +
      'затем вернитесь и нажмите «Попробовать снова». Либо выберите готовое фото ладони из галереи.',
  },
  notfound: {
    title: 'Камера не найдена',
    text:
      'На этом устройстве не обнаружено ни одной камеры. Вы можете загрузить готовое фото ладони из галереи — гадание работает и по нему.',
  },
  busy: {
    title: 'Камера занята',
    text:
      'Камеру уже использует другое приложение или вкладка. Закройте их и нажмите «Попробовать снова». Либо выберите готовое фото ладони.',
  },
  unknown: {
    title: 'Не удалось включить камеру',
    text:
      'Камера не запустилась. Попробуйте ещё раз, перезагрузите страницу или выберите готовое фото ладони из галереи.',
  },
};

const classifyError = (error: unknown): ErrorKind => {
  const name =
    typeof error === 'object' && error !== null && 'name' in error
      ? String((error as { name: unknown }).name)
      : '';

  switch (name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
    case 'SecurityError':
      return 'denied';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
    case 'OverconstrainedError':
    case 'ConstraintNotSatisfiedError':
      return 'notfound';
    case 'NotReadableError':
    case 'TrackStartError':
    case 'AbortError':
      return 'busy';
    default:
      return 'unknown';
  }
};

const hasGetUserMedia = (): boolean =>
  typeof navigator !== 'undefined' &&
  !!navigator.mediaDevices &&
  typeof navigator.mediaDevices.getUserMedia === 'function';

interface CropRect { x: number; y: number; width: number; height: number }

/**
 * Часть кадра, видимая в видоискателе: видео заполняет рамку 3:4
 * (object-fit: cover), поэтому лишнее по краям обрезается так же
 */
const frameCrop = (width: number, height: number): CropRect => {
  if (width / height > FRAME_ASPECT) {
    const w = Math.round(height * FRAME_ASPECT);
    return { x: Math.round((width - w) / 2), y: 0, width: w, height };
  }
  const h = Math.round(width / FRAME_ASPECT);
  return { x: 0, y: Math.round((height - h) / 2), width, height: h };
};

/** Рисует кадр (видео или картинку) на canvas с ограничением по размеру. */
const drawToCanvas = (
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  mirror: boolean,
  crop: CropRect = { x: 0, y: 0, width: sourceWidth, height: sourceHeight }
): HTMLCanvasElement | null => {
  if (!sourceWidth || !sourceHeight) return null;

  const scale = Math.min(1, MAX_OUTPUT_SIZE / Math.max(crop.width, crop.height));
  const width = Math.max(1, Math.round(crop.width * scale));
  const height = Math.max(1, Math.round(crop.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) return null;

  // Фронтальная камера показывается зеркально — снимок делаем таким же,
  // чтобы результат совпадал с тем, что человек видел на экране.
  if (mirror) {
    context.translate(width, 0);
    context.scale(-1, 1);
  }
  context.drawImage(source, crop.x, crop.y, crop.width, crop.height, 0, 0, width, height);
  return canvas;
};

const canvasToPhoto = async (canvas: HTMLCanvasElement): Promise<CapturedPalmPhoto> => {
  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  const base64 = dataUrl.includes(',') ? dataUrl.slice(dataUrl.indexOf(',') + 1) : '';

  // blob: ссылка короткая — её безопасно передавать параметром маршрута,
  // в отличие от многомегабайтного data:URL.
  const uri = await new Promise<string>((resolve) => {
    if (typeof canvas.toBlob !== 'function') {
      resolve(dataUrl);
      return;
    }
    canvas.toBlob(
      (blob) => resolve(blob ? URL.createObjectURL(blob) : dataUrl),
      'image/jpeg',
      JPEG_QUALITY
    );
  });

  return { uri, base64, width: canvas.width, height: canvas.height };
};

export function PalmCamera({ onCaptured, onBack }: PalmCameraProps) {
  const [facing, setFacing] = useState<Facing>('back'); // ладонь снимают основной камерой
  const [status, setStatus] = useState<Status>('starting');
  const [errorKind, setErrorKind] = useState<ErrorKind>('unknown');
  const [errorDetail, setErrorDetail] = useState<string>('');
  const [notice, setNotice] = useState<string>('');
  const [cameraCount, setCameraCount] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [frameSize, setFrameSize] = useState<{ width: number; height: number } | null>(null);

  // Рамка 3:4 — максимально большая, какая помещается на экране
  const handleAreaLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    const w = Math.min(width - 24, height * FRAME_ASPECT);
    if (w > 0) setFrameSize({ width: Math.round(w), height: Math.round(w / FRAME_ASPECT) });
  }, []);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const deviceIdsRef = useRef<string[]>([]);
  const isMountedRef = useRef(true);

  const stopStream = useCallback(() => {
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          /* поток мог быть уже закрыт браузером */
        }
      });
      streamRef.current = null;
    }
    const video = videoRef.current;
    if (video) {
      try {
        video.srcObject = null;
      } catch {
        /* игнорируем */
      }
    }
  }, []);

  const refreshDeviceList = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || typeof navigator.mediaDevices.enumerateDevices !== 'function') {
        return;
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter((device) => device.kind === 'videoinput');
      deviceIdsRef.current = cameras.map((device) => device.deviceId).filter(Boolean);
      if (isMountedRef.current) {
        setCameraCount(cameras.length);
      }
    } catch {
      /* список камер не критичен — просто не покажем переключатель */
    }
  }, []);

  const attachStream = useCallback((stream: MediaStream) => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    video.muted = true;
    // На мобильных браузерах autoplay срабатывает только для muted + playsInline.
    const played = video.play();
    if (played && typeof played.catch === 'function') {
      played.catch(() => {
        /* некоторые браузеры отклоняют play() до жеста — превью всё равно оживёт */
      });
    }
  }, []);

  /**
   * Запускает камеру. Перед каждым запуском старый поток закрывается:
   * Android не даёт держать фронтальную и основную камеру открытыми одновременно.
   */
  const startCamera = useCallback(
    async (target: Facing, deviceId?: string): Promise<boolean> => {
      if (!hasGetUserMedia()) {
        if (isMountedRef.current) {
          setStatus('error');
          setErrorKind('unsupported');
          setErrorDetail('');
        }
        return false;
      }

      if (isMountedRef.current) {
        setStatus('starting');
        setNotice('');
      }
      stopStream();

      const constraints: MediaStreamConstraints = deviceId
        ? { audio: false, video: { deviceId: { exact: deviceId } } }
        : {
            audio: false,
            video: {
              facingMode: { ideal: target === 'back' ? 'environment' : 'user' },
              width: { ideal: 1280 },
              height: { ideal: 1280 },
            },
          };

      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (error) {
        const kind = classifyError(error);
        // Слишком строгие пожелания (facingMode/размер) — пробуем любую камеру.
        if (kind !== 'denied') {
          try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
          } catch (fallbackError) {
            if (isMountedRef.current) {
              setStatus('error');
              setErrorKind(classifyError(fallbackError));
              setErrorDetail(
                typeof fallbackError === 'object' && fallbackError !== null && 'name' in fallbackError
                  ? String((fallbackError as { name: unknown }).name)
                  : ''
              );
            }
            return false;
          }
        } else {
          if (isMountedRef.current) {
            setStatus('error');
            setErrorKind(kind);
            setErrorDetail('');
          }
          return false;
        }
      }

      if (!isMountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return false;
      }

      streamRef.current = stream;
      attachStream(stream);
      setStatus('ready');
      void refreshDeviceList();
      return true;
    },
    [attachStream, refreshDeviceList, stopStream]
  );

  useEffect(() => {
    isMountedRef.current = true;
    void startCamera('back');
    return () => {
      isMountedRef.current = false;
      stopStream();
    };
    // Запускаем один раз при монтировании; переключение идёт через кнопку.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentDeviceId = (): string => {
    const track = streamRef.current?.getVideoTracks()[0];
    const settings = track?.getSettings();
    return settings?.deviceId ?? '';
  };

  const handleSwitchCamera = useCallback(async () => {
    if (isSwitching || isCapturing) return;

    const previousDeviceId = currentDeviceId();
    const next: Facing = facing === 'back' ? 'front' : 'back';

    setIsSwitching(true);
    setFacing(next);
    try {
      const ok = await startCamera(next);
      if (!ok) return;

      // Некоторые устройства (ноутбуки, часть Android) не сообщают facingMode.
      // Если камера не сменилась — переключаемся по deviceId.
      const deviceIds = deviceIdsRef.current;
      if (previousDeviceId && deviceIds.length > 1 && currentDeviceId() === previousDeviceId) {
        const index = deviceIds.indexOf(previousDeviceId);
        const nextId = deviceIds[(index + 1) % deviceIds.length];
        if (nextId && nextId !== previousDeviceId) {
          await startCamera(next, nextId);
        }
      }
    } finally {
      if (isMountedRef.current) {
        setIsSwitching(false);
      }
    }
  }, [facing, isCapturing, isSwitching, startCamera]);

  const handleCapture = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
      setNotice('Камера ещё не готова. Подождите пару секунд и попробуйте снова.');
      return;
    }

    setIsCapturing(true);
    setNotice('');
    try {
      // В снимок попадает ровно то, что видно в рамке
      const canvas = drawToCanvas(
        video, video.videoWidth, video.videoHeight, facing === 'front',
        frameCrop(video.videoWidth, video.videoHeight)
      );
      if (!canvas) {
        setNotice('Не удалось сделать снимок. Попробуйте ещё раз.');
        return;
      }
      const photo = await canvasToPhoto(canvas);
      if (!photo.uri) {
        setNotice('Не удалось сохранить снимок. Попробуйте ещё раз.');
        return;
      }
      stopStream();
      onCaptured(photo);
    } catch (error) {
      console.error('PalmCamera: capture failed', error);
      setNotice('Не удалось сделать снимок. Попробуйте ещё раз.');
    } finally {
      if (isMountedRef.current) {
        setIsCapturing(false);
      }
    }
  }, [facing, onCaptured, stopStream]);

  const handlePickFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelected = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      // Позволяем выбрать тот же файл повторно.
      event.target.value = '';
      if (!file) return;

      const objectUrl = URL.createObjectURL(file);
      try {
        const image = await new Promise<HTMLImageElement>((resolve, reject) => {
          const element = new Image();
          element.onload = () => resolve(element);
          element.onerror = () => reject(new Error('image load failed'));
          element.src = objectUrl;
        });

        const canvas = drawToCanvas(image, image.naturalWidth, image.naturalHeight, false);
        if (!canvas) {
          // Без canvas отдаём файл как есть.
          onCaptured({ uri: objectUrl, base64: '' });
          return;
        }
        const photo = await canvasToPhoto(canvas);
        URL.revokeObjectURL(objectUrl);
        stopStream();
        onCaptured(photo);
      } catch (error) {
        console.error('PalmCamera: file selection failed', error);
        URL.revokeObjectURL(objectUrl);
        setNotice('Не удалось прочитать выбранное фото. Попробуйте другое изображение.');
      }
    },
    [onCaptured, stopStream]
  );

  const videoStyle = useMemo<React.CSSProperties>(
    () => ({
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      backgroundColor: '#000011',
      transform: facing === 'front' ? 'scaleX(-1)' : undefined,
    }),
    [facing]
  );

  const canSwitch = cameraCount > 1;

  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      onChange={handleFileSelected}
      style={{ display: 'none' }}
    />
  );

  const header = (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={onBack} accessibilityLabel="Назад">
        <Ionicons name="arrow-back" size={24} color="#E8E8E8" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Хиромантия</Text>
      <View style={styles.placeholder} />
    </View>
  );

  if (status === 'error') {
    const message = ERROR_MESSAGES[errorKind];
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#000011', '#1a0033', '#2d1b69', '#0f0f23']}
          style={styles.background}
        >
          <StatusBar barStyle="light-content" backgroundColor="#000011" />
          {header}
          <ScrollView contentContainerStyle={styles.stateContainer}>
            <Ionicons name="camera-outline" size={72} color="#9B59B6" />
            <Text style={styles.stateTitle}>{message.title}</Text>
            <Text style={styles.stateText}>{message.text}</Text>
            {!!errorDetail && <Text style={styles.stateDetail}>Код ошибки: {errorDetail}</Text>}
            {!!notice && <Text style={styles.notice}>{notice}</Text>}

            <TouchableOpacity
              style={styles.primaryAction}
              onPress={() => void startCamera(facing)}
            >
              <LinearGradient
                colors={['rgba(155, 89, 182, 0.9)', 'rgba(142, 68, 173, 1)']}
                style={styles.primaryActionGradient}
              >
                <Ionicons name="refresh" size={20} color="#FFF" />
                <Text style={styles.primaryActionText}>Попробовать снова</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryAction} onPress={handlePickFile}>
              <Ionicons name="images-outline" size={20} color="#E8E8E8" />
              <Text style={styles.secondaryActionText}>Выбрать фото ладони</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.tertiaryAction} onPress={onBack}>
              <Text style={styles.tertiaryActionText}>Вернуться назад</Text>
            </TouchableOpacity>
            {fileInput}
          </ScrollView>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000011" />
      <LinearGradient
        colors={['#000011', '#1a0033', '#2d1b69', '#0f0f23']}
        style={styles.background}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack} accessibilityLabel="Назад">
            <Ionicons name="arrow-back" size={24} color="#E8E8E8" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Хиромантия</Text>
          {canSwitch ? (
            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => void handleSwitchCamera()}
              disabled={isSwitching || isCapturing}
              accessibilityLabel="Сменить камеру"
            >
              <Ionicons name="camera-reverse" size={20} color="#E8E8E8" />
              <Text style={styles.switchButtonText}>Сменить</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>

        <Text style={styles.hintLine}>
          Ладонь целиком в рамке, пальцы вместе, свет ровный
        </Text>

        <View style={styles.cameraArea} onLayout={handleAreaLayout}>
          <View style={[styles.frame, frameSize ?? styles.frameFallback]}>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video ref={videoRef} autoPlay playsInline muted style={videoStyle} />

            {/* Уголки рамки — сам снимок совпадает с рамкой */}
            <View style={[styles.corner, styles.cornerTL]} pointerEvents="none" />
            <View style={[styles.corner, styles.cornerTR]} pointerEvents="none" />
            <View style={[styles.corner, styles.cornerBL]} pointerEvents="none" />
            <View style={[styles.corner, styles.cornerBR]} pointerEvents="none" />

            {status === 'starting' && (
              <View style={styles.startingOverlay}>
                <ActivityIndicator size="large" color="#9B59B6" />
                <Text style={styles.startingTitle}>Запускаем камеру...</Text>
                <Text style={styles.startingText}>
                  Если браузер спросит разрешение — нажмите «Разрешить».
                </Text>
                <TouchableOpacity style={styles.secondaryAction} onPress={handlePickFile}>
                  <Ionicons name="images-outline" size={20} color="#E8E8E8" />
                  <Text style={styles.secondaryActionText}>Выбрать фото ладони</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <View style={styles.cameraControls}>
          {!!notice && <Text style={styles.notice}>{notice}</Text>}

          <TouchableOpacity
            style={[styles.captureButton, (isCapturing || isSwitching) && styles.captureButtonDisabled]}
            onPress={() => void handleCapture()}
            disabled={isCapturing || isSwitching || status !== 'ready'}
          >
            <LinearGradient
              colors={
                isCapturing || isSwitching || status !== 'ready'
                  ? ['rgba(100, 100, 100, 0.5)', 'rgba(80, 80, 80, 0.7)']
                  : ['rgba(155, 89, 182, 0.9)', 'rgba(142, 68, 173, 1)']
              }
              style={styles.captureButtonGradient}
            >
              {isCapturing ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Ionicons name="camera" size={28} color="#FFF" />
              )}
              <Text style={styles.captureButtonText}>Сфотографировать</Text>
            </LinearGradient>
          </TouchableOpacity>

          {canSwitch && (
            <TouchableOpacity
              style={styles.switchPill}
              onPress={() => void handleSwitchCamera()}
              disabled={isSwitching || isCapturing}
            >
              <Ionicons name="camera-reverse" size={18} color="#E8E8E8" />
              <Text style={styles.switchPillText}>
                {isSwitching ? 'Переключаем...' : 'Сменить камеру'}
              </Text>
            </TouchableOpacity>
          )}
          {fileInput}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

export default PalmCamera;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000011',
  },
  background: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E8E8E8',
  },
  placeholder: {
    width: 40,
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.6)',
    backgroundColor: 'rgba(155, 89, 182, 0.2)',
  },
  switchButtonText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#E8E8E8',
  },
  cameraArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintLine: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  frame: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(155, 89, 182, 0.8)',
    backgroundColor: '#000011',
  },
  frameFallback: {
    width: 300,
    height: 400,
  },
  corner: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderColor: '#FFFFFF',
  },
  cornerTL: { top: 10, left: 10, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 10 },
  cornerTR: { top: 10, right: 10, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 10 },
  cornerBL: { bottom: 10, left: 10, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 10 },
  cornerBR: { bottom: 10, right: 10, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 10 },
  startingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 17, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  startingTitle: {
    marginTop: 18,
    fontSize: 18,
    fontWeight: '600',
    color: '#E8E8E8',
    textAlign: 'center',
  },
  startingText: {
    marginTop: 8,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    lineHeight: 20,
  },
  cameraControls: {
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  notice: {
    fontSize: 13,
    color: '#F1C40F',
    textAlign: 'center',
    marginBottom: 10,
    marginTop: 10,
  },
  captureButton: {
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 10,
  },
  captureButtonDisabled: {
    opacity: 0.7,
  },
  captureButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 10,
  },
  switchPill: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.6)',
    backgroundColor: 'rgba(155, 89, 182, 0.18)',
  },
  switchPillText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#E8E8E8',
  },
  stateContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 40,
  },
  stateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#E8E8E8',
    textAlign: 'center',
    marginTop: 18,
  },
  stateText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 12,
  },
  stateDetail: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.45)',
    marginTop: 10,
  },
  primaryAction: {
    marginTop: 26,
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 10,
  },
  primaryActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  primaryActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 8,
  },
  secondaryAction: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.6)',
    backgroundColor: 'rgba(155, 89, 182, 0.18)',
  },
  secondaryActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E8E8E8',
    marginLeft: 8,
  },
  tertiaryAction: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  tertiaryActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
