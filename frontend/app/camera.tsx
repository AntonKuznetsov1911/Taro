import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { PalmCamera } from '../components/PalmCamera';
import { CapturedPalmPhoto } from '../components/palmCameraTypes';
import { generateOfflinePalmResult } from '../src/utils/offlineApi';

export default function CameraScreen() {
  const router = useRouter();
  const [captured, setCaptured] = useState<CapturedPalmPhoto | null>(null);
  const [question, setQuestion] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  // Alert.alert на react-native-web ничего не показывает,
  // поэтому все сообщения выводим прямо на экране.
  const [notice, setNotice] = useState<string>('');

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }, [router]);

  const handleCaptured = useCallback((photo: CapturedPalmPhoto) => {
    setNotice('');
    setCaptured(photo);
  }, []);

  const retakePicture = useCallback(() => {
    setCaptured(null);
    setQuestion('');
    setNotice('');
  }, []);

  const proceedWithImage = useCallback(async () => {
    if (!captured?.uri) {
      setNotice('Не удалось получить изображение. Сделайте снимок ещё раз.');
      return;
    }

    if (!question.trim()) {
      setNotice('Пожалуйста, введите вопрос для гадания.');
      return;
    }

    try {
      setIsAnalyzing(true);
      setNotice('');

      // Толкование генерируется офлайн — интернет не нужен.
      const data = await generateOfflinePalmResult(question.trim());

      router.push({
        pathname: '/palmistry-result',
        params: {
          imageUri: captured.uri,
          question: question.trim(),
          interpretation: data.interpretation,
          palmLines: JSON.stringify(data.lines),
        },
      });
    } catch (error) {
      console.error('Error analyzing palm:', error);
      setNotice('Не удалось проанализировать ладонь. Попробуйте ещё раз.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [captured, question, router]);

  if (!captured) {
    return <PalmCamera onCaptured={handleCaptured} onBack={goBack} />;
  }

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
              onPress={retakePicture}
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
            <Image source={{ uri: captured.uri }} style={styles.previewImage} />

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
                onChangeText={(value) => {
                  setQuestion(value);
                  if (notice) setNotice('');
                }}
                multiline
                numberOfLines={3}
                maxLength={200}
                editable={!isAnalyzing}
              />
              <Text style={styles.characterCount}>{question.length}/200</Text>
              {!!notice && <Text style={styles.notice}>{notice}</Text>}
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
              onPress={() => void proceedWithImage()}
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
  notice: {
    fontSize: 13,
    color: '#F1C40F',
    marginTop: 8,
    textAlign: 'center',
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
