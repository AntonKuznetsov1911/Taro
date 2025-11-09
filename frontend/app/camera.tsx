import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Image,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImageManipulator from 'expo-image-manipulator';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function CameraScreen() {
  const router = useRouter();
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedImageBase64, setCapturedImageBase64] = useState<string>('');
  const [question, setQuestion] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    // Camera permissions are still loading
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#000011', '#1a0033', '#2d1b69', '#0f0f23']}
          style={styles.background}
        >
          <View style={styles.permissionContainer}>
            <Ionicons name="camera" size={80} color="#9B59B6" />
            <Text style={styles.permissionText}>
              Для гадания по руке необходимо разрешение на использование камеры
            </Text>
            <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
              <LinearGradient
                colors={['rgba(155, 89, 182, 0.9)', 'rgba(142, 68, 173, 1)']}
                style={styles.permissionButtonGradient}
              >
                <Text style={styles.permissionButtonText}>Разрешить камеру</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        setIsProcessing(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
        });

        if (photo && photo.base64) {
          // Resize image for better processing
          const manipResult = await ImageManipulator.manipulateAsync(
            photo.uri,
            [{ resize: { width: 800, height: 1000 } }],
            {
              compress: 0.8,
              format: ImageManipulator.SaveFormat.JPEG,
              base64: true,
            }
          );

          setCapturedImage(manipResult.uri);
          setCapturedImageBase64(manipResult.base64 || '');
          setIsProcessing(false);
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Ошибка', 'Не удалось сделать снимок. Попробуйте еще раз.');
        setIsProcessing(false);
      }
    }
  };

  const retakePicture = () => {
    setCapturedImage(null);
    setCapturedImageBase64('');
    setQuestion('');
  };

  const proceedWithImage = async () => {
    if (!capturedImageBase64) {
      Alert.alert('Ошибка', 'Не удалось получить изображение');
      return;
    }

    if (!question.trim()) {
      Alert.alert('Внимание', 'Пожалуйста, введите вопрос для гадания');
      return;
    }

    try {
      setIsAnalyzing(true);

      // Call palmistry API
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/palmistry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: `data:image/jpeg;base64,${capturedImageBase64}`,
          question: question.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();

      // Navigate to result screen with analysis data
      router.push({
        pathname: '/palmistry-result',
        params: {
          imageUri: capturedImage,
          question: question.trim(),
          interpretation: data.interpretation,
          palmLines: JSON.stringify(data.palm_lines),
        },
      });
    } catch (error) {
      console.error('Error analyzing palm:', error);
      Alert.alert('Ошибка', 'Не удалось проанализировать ладонь. Попробуйте еще раз.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  if (capturedImage) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <LinearGradient
            colors={['#000011', '#1a0033', '#2d1b69', '#0f0f23']}
            style={styles.background}
          >
            <StatusBar barStyle="light-content" backgroundColor="#000011" />

            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
                disabled={isAnalyzing}
              >
                <Ionicons name="arrow-back" size={24} color="#E8E8E8" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Предварительный просмотр</Text>
              <View style={styles.placeholder} />
            </View>

            <ScrollView
              style={styles.scrollContainer}
              contentContainerStyle={styles.previewContainer}
              keyboardShouldPersistTaps="handled"
            >
              <Image source={{ uri: capturedImage }} style={styles.previewImage} />

              <View style={styles.instructionBox}>
                <Text style={styles.instructionTitle}>✨ Проверьте снимок</Text>
                <Text style={styles.instructionText}>
                  Убедитесь, что линии ладони хорошо видны. Если снимок получился нечетким, сделайте новое фото.
                </Text>
              </View>

              <View style={styles.questionContainer}>
                <Text style={styles.questionLabel}>Ваш вопрос:</Text>
                <TextInput
                  style={styles.questionInput}
                  placeholder="Например: Что меня ждет в ближайшем будущем?"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={question}
                  onChangeText={setQuestion}
                  multiline
                  numberOfLines={3}
                  maxLength={200}
                  editable={!isAnalyzing}
                />
                <Text style={styles.characterCount}>{question.length}/200</Text>
              </View>
            </ScrollView>

            <View style={styles.bottomActions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={retakePicture}
                disabled={isAnalyzing}
              >
                <LinearGradient
                  colors={['rgba(231, 76, 60, 0.8)', 'rgba(192, 57, 43, 0.9)']}
                  style={styles.buttonGradient}
                >
                  <Ionicons name="camera" size={20} color="#FFF" />
                  <Text style={styles.secondaryButtonText}>Переснять</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryButton, isAnalyzing && styles.buttonDisabled]}
                onPress={proceedWithImage}
                disabled={isAnalyzing}
              >
                <LinearGradient
                  colors={isAnalyzing ?
                    ['rgba(100, 100, 100, 0.5)', 'rgba(80, 80, 80, 0.7)'] :
                    ['rgba(155, 89, 182, 0.9)', 'rgba(142, 68, 173, 1)']}
                  style={styles.buttonGradient}
                >
                  {isAnalyzing ? (
                    <>
                      <ActivityIndicator size="small" color="#FFF" />
                      <Text style={styles.primaryButtonText}>Анализ...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="sparkles" size={20} color="#FFF" />
                      <Text style={styles.primaryButtonText}>Гадать</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000011" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#E8E8E8" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Хиромантия</Text>
        <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
          <Ionicons name="camera-reverse" size={24} color="#E8E8E8" />
        </TouchableOpacity>
      </View>

      <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.6)', 'transparent', 'transparent', 'rgba(0, 0, 0, 0.6)']}
          style={styles.cameraOverlay}
        >
          {/* Palm outline guide */}
          <View style={styles.palmGuideContainer}>
            <View style={styles.palmOutline}>
              <Text style={styles.guideText}>Разместите левую руку здесь</Text>
              <Text style={styles.guideSubtext}>Ладонь должна полностью помещаться в рамку</Text>
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
            </View>
          </View>

          <View style={styles.cameraControls}>
            <TouchableOpacity 
              style={[styles.captureButton, isProcessing && styles.captureButtonDisabled]} 
              onPress={takePicture}
              disabled={isProcessing}
            >
              <LinearGradient
                colors={isProcessing ? 
                  ['rgba(100, 100, 100, 0.5)', 'rgba(80, 80, 80, 0.7)'] : 
                  ['rgba(155, 89, 182, 0.9)', 'rgba(142, 68, 173, 1)']}
                style={styles.captureButtonGradient}
              >
                {isProcessing ? (
                  <ActivityIndicator size="large" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="camera" size={32} color="#FFF" />
                    <Text style={styles.captureButtonText}>Сфотографировать</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </CameraView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  flipButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
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
    height: 350,
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
    marginVertical: 20,
  },
  instructionBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 15,
    padding: 20,
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
  cameraControls: {
    alignItems: 'center',
    paddingBottom: 40,
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
    paddingVertical: 18,
    paddingHorizontal: 30,
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
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionText: {
    fontSize: 16,
    color: '#E8E8E8',
    textAlign: 'center',
    marginVertical: 30,
    lineHeight: 22,
  },
  permissionButton: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 10,
  },
  permissionButtonGradient: {
    paddingVertical: 15,
    paddingHorizontal: 30,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  scrollContainer: {
    flex: 1,
  },
  previewContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  previewImage: {
    width: 300,
    height: 400,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(155, 89, 182, 0.5)',
    marginBottom: 20,
  },
  questionContainer: {
    width: '100%',
    maxWidth: 320,
    marginTop: 20,
  },
  questionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E8E8E8',
    marginBottom: 10,
  },
  questionInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    color: '#E8E8E8',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.5)',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'right',
    marginTop: 5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  primaryButton: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 10,
    flex: 1,
    marginLeft: 10,
  },
  secondaryButton: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 10,
    flex: 1,
    marginRight: 10,
  },
  buttonGradient: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 8,
  },
});