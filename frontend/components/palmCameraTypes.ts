/**
 * Общие типы для платформенных реализаций камеры ладони.
 *
 * На вебе камера работает через navigator.mediaDevices (PalmCamera.web.tsx),
 * на нативных платформах — через expo-camera (PalmCamera.tsx).
 */

export interface CapturedPalmPhoto {
  /** Ссылка на изображение, пригодная для <Image source={{ uri }} />. */
  uri: string;
  /** Изображение в base64 без префикса data:. Может быть пустым на нативе. */
  base64: string;
}

export interface PalmCameraProps {
  /** Вызывается, когда снимок готов. */
  onCaptured: (photo: CapturedPalmPhoto) => void;
  /** Вызывается по кнопке «Назад». */
  onBack: () => void;
}
