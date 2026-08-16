import React, { useCallback, useRef, useState } from 'react';
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
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import { PalmCameraProps } from './palmCameraTypes';

/**
 * Нативная реализация камеры ладони (iOS/Android) на expo-camera.
 * Веб-версия живёт в PalmCamera.web.tsx и работает через getUserMedia.
 */
export function PalmCamera({ onCaptured, onBack }: PalmCameraProps) {
  const [facing, setFacing] = useState<CameraType>('back'); // ладонь снимают основной камерой
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [mountError, setMountError] = useState(false);
  const [notice, setNotice] = useState('');
  const cameraRef = useRef<CameraView>(null);

  const toggleCameraFacing = useCallback(() => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }, []);

  const header = (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={onBack} accessibilityLabel="Назад">
        <Ionicons name="arrow-back" size={24} color="#E8E8E8" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Хиромантия</Text>
      <View style={styles.placeholder} />
    </View>
  );

  const takePicture = useCallback(async () => {
    if (!cameraRef.current) {
      setNotice('Камера недоступна. Попробуйте ещё раз.');
      return;
    }

    try {
      setIsProcessing(true);
      setNotice('');

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      if (!photo || !photo.uri) {
        setNotice('Не удалось сделать снимок. Попробуйте ещё раз.');
        return;
      }

      const manipResult = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 800, height: 1000 } }],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );

      onCaptured({
        uri: manipResult.uri || photo.uri,
        base64: manipResult.base64 || photo.base64 || '',
      });
    } catch (error) {
      console.error('PalmCamera: capture failed', error);
      setNotice('Не удалось сделать снимок. Попробуйте ещё раз.');
    } finally {
      setIsProcessing(false);
    }
  }, [onCaptured]);

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#000011', '#1a0033', '#2d1b69', '#0f0f23']}
          style={styles.background}
        >
          <StatusBar barStyle="light-content" backgroundColor="#000011" />
          {header}
          <View style={styles.stateContainer}>
            <ActivityIndicator size="large" color="#9B59B6" />
            <Text style={styles.stateText}>Проверяем доступ к камере...</Text>
            <TouchableOpacity style={styles.tertiaryAction} onPress={onBack}>
              <Text style={styles.tertiaryActionText}>Вернуться назад</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#000011', '#1a0033', '#2d1b69', '#0f0f23']}
          style={styles.background}
        >
          <StatusBar barStyle="light-content" backgroundColor="#000011" />
          {header}
          <ScrollView contentContainerStyle={styles.stateContainer}>
            <Ionicons name="camera" size={72} color="#9B59B6" />
            <Text style={styles.stateTitle}>Нужен доступ к камере</Text>
            <Text style={styles.stateText}>
              {permission.canAskAgain
                ? 'Для гадания по руке разрешите приложению использовать камеру.'
                : 'Доступ к камере запрещён. Откройте настройки устройства и разрешите камеру для приложения.'}
            </Text>
            <TouchableOpacity
              style={styles.primaryAction}
              onPress={() => void requestPermission()}
            >
              <LinearGradient
                colors={['rgba(155, 89, 182, 0.9)', 'rgba(142, 68, 173, 1)']}
                style={styles.primaryActionGradient}
              >
                <Text style={styles.primaryActionText}>Разрешить камеру</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tertiaryAction} onPress={onBack}>
              <Text style={styles.tertiaryActionText}>Вернуться назад</Text>
            </TouchableOpacity>
          </ScrollView>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (mountError) {
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
            <Text style={styles.stateTitle}>Не удалось включить камеру</Text>
            <Text style={styles.stateText}>
              Камера не запустилась. Возможно, её использует другое приложение. Закройте его и
              попробуйте снова.
            </Text>
            <TouchableOpacity style={styles.primaryAction} onPress={() => setMountError(false)}>
              <LinearGradient
                colors={['rgba(155, 89, 182, 0.9)', 'rgba(142, 68, 173, 1)']}
                style={styles.primaryActionGradient}
              >
                <Text style={styles.primaryActionText}>Попробовать снова</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tertiaryAction} onPress={onBack}>
              <Text style={styles.tertiaryActionText}>Вернуться назад</Text>
            </TouchableOpacity>
          </ScrollView>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000011" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} accessibilityLabel="Назад">
          <Ionicons name="arrow-back" size={24} color="#E8E8E8" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Хиромантия</Text>
        <TouchableOpacity
          style={styles.switchButton}
          onPress={toggleCameraFacing}
          accessibilityLabel="Сменить камеру"
        >
          <Ionicons name="camera-reverse" size={20} color="#E8E8E8" />
          <Text style={styles.switchButtonText}>Сменить</Text>
        </TouchableOpacity>
      </View>

      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        onMountError={() => setMountError(true)}
      >
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.6)', 'transparent', 'transparent', 'rgba(0, 0, 0, 0.6)']}
          style={styles.cameraOverlay}
        >
          <View style={styles.palmGuideContainer}>
            <View style={styles.palmOutline}>
              <Text style={styles.guideText}>Разместите левую руку здесь</Text>
              <Text style={styles.guideSubtext}>
                Ладонь должна полностью помещаться в рамку
              </Text>
            </View>
          </View>

          <View style={styles.instructionPanel}>
            <View style={styles.instructionBox}>
              <Text style={styles.instructionTitle}>🤲 Инструкция</Text>
              <Text style={styles.instructionText}>
                • Поместите левую руку в рамку{'\n'}
                • Разверните ладонь к камере{'\n'}
                • Убедитесь, что линии видны четко{'\n'}
                • Держите руку неподвижно
              </Text>
              <Text style={styles.cameraHint}>
                Сейчас камера: {facing === 'back' ? 'основная' : 'фронтальная'}
              </Text>
            </View>
          </View>

          <View style={styles.cameraControls}>
            {!!notice && <Text style={styles.notice}>{notice}</Text>}

            <TouchableOpacity
              style={[styles.captureButton, isProcessing && styles.captureButtonDisabled]}
              onPress={() => void takePicture()}
              disabled={isProcessing}
            >
              <LinearGradient
                colors={
                  isProcessing
                    ? ['rgba(100, 100, 100, 0.5)', 'rgba(80, 80, 80, 0.7)']
                    : ['rgba(155, 89, 182, 0.9)', 'rgba(142, 68, 173, 1)']
                }
                style={styles.captureButtonGradient}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Ionicons name="camera" size={28} color="#FFF" />
                )}
                <Text style={styles.captureButtonText}>Сфотографировать</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchPill}
              onPress={toggleCameraFacing}
              disabled={isProcessing}
            >
              <Ionicons name="camera-reverse" size={18} color="#E8E8E8" />
              <Text style={styles.switchPillText}>Сменить камеру</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </CameraView>
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
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  palmGuideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  palmOutline: {
    width: 280,
    height: 320,
    maxWidth: '100%',
    borderWidth: 3,
    borderColor: 'rgba(155, 89, 182, 0.8)',
    borderRadius: 20,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(155, 89, 182, 0.1)',
  },
  guideText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  guideSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  instructionPanel: {
    alignSelf: 'center',
    marginVertical: 10,
  },
  instructionBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 15,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.5)',
    maxWidth: 320,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E8E8E8',
    marginBottom: 8,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
    textAlign: 'left',
  },
  cameraHint: {
    marginTop: 10,
    fontSize: 12,
    color: '#BB6BD9',
    textAlign: 'center',
  },
  cameraControls: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  notice: {
    fontSize: 13,
    color: '#F1C40F',
    textAlign: 'center',
    marginBottom: 10,
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
