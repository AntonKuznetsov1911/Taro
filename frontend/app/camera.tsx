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
import {
  PalmFeatures,
  HAND_SHAPE_OPTIONS,
  LINE_TRAIT_OPTIONS,
  PALM_LINE_STEPS,
  generatePalmReading,
  isPalmFeaturesComplete,
} from '../src/utils/palmReading';

export default function CameraScreen() {
  const router = useRouter();
  const [captured, setCaptured] = useState<CapturedPalmPhoto | null>(null);
  const [question, setQuestion] = useState<string>('');
  // Офлайн-приложение не распознаёт линии на фото — их описывает сам человек,
  // глядя на снимок
  const [features, setFeatures] = useState<Partial<PalmFeatures>>({});
  const setFeature = useCallback(<K extends keyof PalmFeatures>(key: K, value: PalmFeatures[K]) => {
    setFeatures(prev => ({ ...prev, [key]: value }));
    setNotice('');
  }, []);
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
    setFeatures({});
    setNotice('');
  }, []);

  const proceedWithImage = useCallback(async () => {
    if (!captured?.uri) {
      setNotice('Не удалось получить изображение. Сделайте снимок ещё раз.');
      return;
    }

    if (!isPalmFeaturesComplete(features)) {
      setNotice('Отметьте форму руки и вид каждой линии — по ним строится толкование.');
      return;
    }

    try {
      setIsAnalyzing(true);
      setNotice('');

      const interpretation = generatePalmReading(features, question.trim() || undefined);

      router.push({
        pathname: '/palmistry-result',
        params: {
          imageUri: captured.uri,
          question: question.trim(),
          interpretation,
          palmLines: '[]',
        },
      });
    } catch (error) {
      console.error('Error analyzing palm:', error);
      setNotice('Не удалось проанализировать ладонь. Попробуйте ещё раз.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [captured, question, features, router]);

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
            <Text style={styles.headerTitle}>Ваша ладонь</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.previewContainer}
            keyboardShouldPersistTaps="handled"
          >
            <Image source={{ uri: captured.uri }} style={styles.previewImage} />

            <View style={styles.instructionBox}>
              <Text style={styles.instructionTitle}>✨ Опишите свою ладонь</Text>
              <Text style={styles.instructionText}>
                Посмотрите на снимок или на свою руку и отметьте, что видите. Читают обычно ведущую руку — правую у правшей.
              </Text>
            </View>

            <View style={styles.featureGroup}>
              <Text style={styles.featureTitle}>Форма руки</Text>
              <View style={styles.chips}>
                {HAND_SHAPE_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option.id}
                    style={[styles.chipWide, features.hand === option.id && styles.chipSelected]}
                    onPress={() => setFeature('hand', option.id)}
                  >
                    <Text style={[styles.chipText, features.hand === option.id && styles.chipTextSelected]}>{option.title}</Text>
                    <Text style={styles.chipHint}>{option.hint}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {PALM_LINE_STEPS.map(step => (
              <View key={step.id} style={styles.featureGroup}>
                <Text style={styles.featureTitle}>{step.title}</Text>
                <Text style={styles.featureWhere}>{step.where}</Text>
                <View style={styles.chips}>
                  {LINE_TRAIT_OPTIONS.map(option => (
                    <TouchableOpacity
                      key={option.id}
                      style={[styles.chip, features[step.id] === option.id && styles.chipSelected]}
                      onPress={() => setFeature(step.id, option.id)}
                    >
                      <Text style={[styles.chipText, features[step.id] === option.id && styles.chipTextSelected]}>{option.title}</Text>
                    </TouchableOpacity>
                  ))}
                  {step.optional && (
                    <TouchableOpacity
                      style={[styles.chip, features[step.id] === 'none' && styles.chipSelected]}
                      onPress={() => setFeature('fate_line', 'none')}
                    >
                      <Text style={[styles.chipText, features[step.id] === 'none' && styles.chipTextSelected]}>Не вижу</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}

            <View style={styles.questionContainer}>
              <Text style={styles.questionLabel}>Ваш вопрос (необязательно):</Text>
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
                    <Text style={styles.primaryButtonText}>Толкование...</Text>
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
  featureGroup: {
    width: '100%',
    maxWidth: 360,
    marginTop: 18,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E8E8E8',
    marginBottom: 4,
  },
  featureWhere: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  chipWide: {
    width: '48%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  chipSelected: {
    backgroundColor: 'rgba(155, 89, 182, 0.45)',
    borderColor: '#BB6BD9',
  },
  chipText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  chipTextSelected: {
    color: '#FFF',
    fontWeight: '600',
  },
  chipHint: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.55)',
    marginTop: 2,
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
