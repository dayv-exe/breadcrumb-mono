import { useEffect } from 'react';
import { EmitterSubscription, Keyboard, Platform } from 'react-native';

interface UseKeyboardListenerOptions {
  onShow?: () => void;
  onHide?: () => void;
  onWillShow?: () => void;  // iOS only
  onWillHide?: () => void;  // iOS only
}

export const useKeyboardListener = (options: UseKeyboardListenerOptions) => {
  const { onShow, onHide, onWillHide, onWillShow } = options;

  useEffect(() => {
    const subscriptions: EmitterSubscription[] = [];

    // Handle show events based on platform
    if (Platform.OS === 'ios') {
      // iOS: Use willShow if provided, otherwise didShow
      if (onWillShow) {
        subscriptions.push(Keyboard.addListener('keyboardWillShow', onWillShow));
      }
      if (onShow) {
        subscriptions.push(Keyboard.addListener('keyboardDidShow', onShow));
      }
    } else {
      // Android: Only didShow is available, use it for both callbacks
      if (onWillShow || onShow) {
        const callback = onWillShow || onShow;
        subscriptions.push(Keyboard.addListener('keyboardDidShow', callback!));
      }
    }

    // Handle hide events based on platform
    if (Platform.OS === 'ios') {
      // iOS: Use willHide if provided, otherwise didHide
      if (onWillHide) {
        subscriptions.push(Keyboard.addListener('keyboardWillHide', onWillHide));
      }
      if (onHide) {
        subscriptions.push(Keyboard.addListener('keyboardDidHide', onHide));
      }
    } else {
      // Android: Only didHide is available, use it for both callbacks
      if (onWillHide || onHide) {
        const callback = onWillHide || onHide;
        subscriptions.push(Keyboard.addListener('keyboardDidHide', callback!));
      }
    }

    return () => {
      subscriptions.forEach((sub) => sub.remove());
    };
  }, [onShow, onHide, onWillHide, onWillShow]);
};