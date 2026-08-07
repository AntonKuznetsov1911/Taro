import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';

interface InstallPWAPromptProps {
  onClose?: () => void;
}

export function InstallPWAPrompt({ onClose }: InstallPWAPromptProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(100)).current;

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    // Check if already installed
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Listen for install prompt
    const handleInstallable = () => {
      setIsVisible(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 10,
      }).start();
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
    };

    window.addEventListener('pwa-installable', handleInstallable);
    window.addEventListener('pwa-installed', handleInstalled);

    // Check if prompt is already available
    if ((window as any).installPWA) {
      // Trigger check for existing deferred prompt
      setTimeout(handleInstallable, 3000);
    }

    return () => {
      window.removeEventListener('pwa-installable', handleInstallable);
      window.removeEventListener('pwa-installed', handleInstalled);
    };
  }, [slideAnim]);

  const handleInstall = async () => {
    if (Platform.OS !== 'web') return;

    const installPWA = (window as any).installPWA;
    if (installPWA) {
      const outcome = await installPWA();
      if (outcome === 'accepted') {
        setIsVisible(false);
      }
    }
  };

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: 100,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
      onClose?.();
    });
  };

  if (Platform.OS !== 'web' || !isVisible || isInstalled) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>📲</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Установить приложение</Text>
          <Text style={styles.subtitle}>
            Добавьте Таро на главный экран для быстрого доступа
          </Text>
        </View>
      </View>
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
          <Text style={styles.dismissText}>Позже</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.installButton} onPress={handleInstall}>
          <Text style={styles.installText}>Установить</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(26, 26, 46, 0.98)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(155, 89, 182, 0.3)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 30,
    shadowColor: '#9B59B6',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(155, 89, 182, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  dismissButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  dismissText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
  installButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#9B59B6',
    alignItems: 'center',
  },
  installText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default InstallPWAPrompt;
