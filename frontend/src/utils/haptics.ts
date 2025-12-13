import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Haptic feedback manager for tactile user feedback
 */

export enum HapticType {
  LIGHT = 'light',
  MEDIUM = 'medium',
  HEAVY = 'heavy',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  SELECTION = 'selection',
}

class HapticsManager {
  private enabled: boolean = true;

  /**
   * Enable or disable haptic feedback
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if haptics are enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Trigger light impact haptic
   */
  async light(): Promise<void> {
    if (!this.enabled) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.warn('Haptic feedback error:', error);
    }
  }

  /**
   * Trigger medium impact haptic
   */
  async medium(): Promise<void> {
    if (!this.enabled) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.warn('Haptic feedback error:', error);
    }
  }

  /**
   * Trigger heavy impact haptic
   */
  async heavy(): Promise<void> {
    if (!this.enabled) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (error) {
      console.warn('Haptic feedback error:', error);
    }
  }

  /**
   * Trigger success notification haptic
   */
  async success(): Promise<void> {
    if (!this.enabled) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.warn('Haptic feedback error:', error);
    }
  }

  /**
   * Trigger warning notification haptic
   */
  async warning(): Promise<void> {
    if (!this.enabled) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (error) {
      console.warn('Haptic feedback error:', error);
    }
  }

  /**
   * Trigger error notification haptic
   */
  async error(): Promise<void> {
    if (!this.enabled) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (error) {
      console.warn('Haptic feedback error:', error);
    }
  }

  /**
   * Trigger selection haptic (for UI interactions)
   */
  async selection(): Promise<void> {
    if (!this.enabled) return;
    try {
      await Haptics.selectionAsync();
    } catch (error) {
      console.warn('Haptic feedback error:', error);
    }
  }

  /**
   * Trigger haptic by type
   */
  async trigger(type: HapticType): Promise<void> {
    switch (type) {
      case HapticType.LIGHT:
        await this.light();
        break;
      case HapticType.MEDIUM:
        await this.medium();
        break;
      case HapticType.HEAVY:
        await this.heavy();
        break;
      case HapticType.SUCCESS:
        await this.success();
        break;
      case HapticType.WARNING:
        await this.warning();
        break;
      case HapticType.ERROR:
        await this.error();
        break;
      case HapticType.SELECTION:
        await this.selection();
        break;
    }
  }

  /**
   * Card flip haptic sequence
   */
  async cardFlip(): Promise<void> {
    if (!this.enabled) return;
    await this.medium();
  }

  /**
   * Card reveal haptic sequence
   */
  async cardReveal(): Promise<void> {
    if (!this.enabled) return;
    await this.light();
    setTimeout(async () => {
      await this.medium();
    }, 100);
  }

  /**
   * Button press haptic
   */
  async buttonPress(): Promise<void> {
    if (!this.enabled) return;
    await this.light();
  }

  /**
   * Toggle haptic
   */
  async toggle(): Promise<void> {
    if (!this.enabled) return;
    await this.selection();
  }

  /**
   * Favorite/unfavorite haptic
   */
  async favorite(): Promise<void> {
    if (!this.enabled) return;
    await this.medium();
  }
}

export const haptics = new HapticsManager();

/**
 * Convenience functions for common haptic patterns
 */
export const HapticFeedback = {
  light: () => haptics.light(),
  medium: () => haptics.medium(),
  heavy: () => haptics.heavy(),
  success: () => haptics.success(),
  warning: () => haptics.warning(),
  error: () => haptics.error(),
  selection: () => haptics.selection(),
  cardFlip: () => haptics.cardFlip(),
  cardReveal: () => haptics.cardReveal(),
  buttonPress: () => haptics.buttonPress(),
  toggle: () => haptics.toggle(),
  favorite: () => haptics.favorite(),
};
