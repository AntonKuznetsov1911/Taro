import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { checkForUpdates, installUpdate } from '../src/utils/versionCheck';

/**
 * Component that checks for and displays available updates
 */
export const UpdateNotification: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    checkForUpdate();
  }, []);

  const checkForUpdate = async () => {
    const { isAvailable } = await checkForUpdates();
    if (isAvailable) {
      setUpdateAvailable(true);
      setShowModal(true);
    }
  };

  const handleInstall = async () => {
    setIsInstalling(true);
    await installUpdate();
    // App will reload after update
  };

  const handleDismiss = () => {
    setShowModal(false);
  };

  if (!updateAvailable) {
    return null;
  }

  return (
    <Modal
      visible={showModal}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <LinearGradient
            colors={['#1a1a2e', '#16213e', '#0f0f23']}
            style={styles.gradient}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="cloud-download" size={60} color="#4ECDC4" />
            </View>

            <Text style={styles.title}>Доступно обновление!</Text>
            <Text style={styles.message}>
              Новая версия приложения готова к установке. Обновление включает новые
              функции и улучшения.
            </Text>

            <View style={styles.buttons}>
              <TouchableOpacity
                style={styles.installButton}
                onPress={handleInstall}
                disabled={isInstalling}
              >
                <LinearGradient
                  colors={['#4ECDC4', '#26A0B4']}
                  style={styles.buttonGradient}
                >
                  {isInstalling ? (
                    <Text style={styles.buttonText}>Установка...</Text>
                  ) : (
                    <>
                      <Ionicons name="download" size={20} color="#FFF" />
                      <Text style={styles.buttonText}>Установить</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
                <Text style={styles.dismissText}>Позже</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
  },
  gradient: {
    padding: 30,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
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
  buttons: {
    width: '100%',
    gap: 15,
  },
  installButton: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  dismissButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  dismissText: {
    fontSize: 14,
    color: '#9B59B6',
    fontWeight: '600',
  },
});
