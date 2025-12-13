import React, { Component, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

/**
 * ErrorBoundary component catches React errors in child components
 * and displays a fallback UI instead of crashing the entire app
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: error.stack || null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // In production, you could send this to an error tracking service
    // like Sentry, Bugsnag, etc.
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <SafeAreaView style={styles.container}>
          <LinearGradient
            colors={['#0a0a0a', '#1a1a2e', '#16213e']}
            style={styles.background}
          >
            <View style={styles.content}>
              <View style={styles.iconContainer}>
                <Ionicons name="warning" size={80} color="#FF6B9D" />
              </View>

              <Text style={styles.title}>Что-то пошло не так</Text>
              <Text style={styles.message}>
                Произошла непредвиденная ошибка. Пожалуйста, попробуйте перезапустить приложение.
              </Text>

              {__DEV__ && this.state.error && (
                <ScrollView style={styles.errorDetails}>
                  <Text style={styles.errorTitle}>Детали ошибки (режим разработки):</Text>
                  <Text style={styles.errorText}>{this.state.error.toString()}</Text>
                  {this.state.errorInfo && (
                    <Text style={styles.errorStack}>{this.state.errorInfo}</Text>
                  )}
                </ScrollView>
              )}

              <TouchableOpacity style={styles.resetButton} onPress={this.handleReset}>
                <LinearGradient
                  colors={['#9B59B6', '#8E44AD']}
                  style={styles.resetButtonGradient}
                >
                  <Ionicons name="refresh" size={20} color="#FFF" />
                  <Text style={styles.resetButtonText}>Попробовать снова</Text>
                </LinearGradient>
              </TouchableOpacity>

              <Text style={styles.hint}>
                Если проблема повторяется, попробуйте полностью перезапустить приложение
              </Text>
            </View>
          </LinearGradient>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  iconContainer: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#E8E8E8',
    marginBottom: 15,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#B8B8B8',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  errorDetails: {
    maxHeight: 200,
    width: '100%',
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B9D',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 12,
    color: '#E8E8E8',
    marginBottom: 10,
    fontFamily: 'monospace',
  },
  errorStack: {
    fontSize: 10,
    color: '#B8B8B8',
    fontFamily: 'monospace',
  },
  resetButton: {
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 20,
  },
  resetButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    gap: 10,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
