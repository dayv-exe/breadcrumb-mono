import React, { useEffect, useState } from 'react';
import {
  EmitterSubscription,
  Keyboard,
  Platform,
  StyleSheet,
  View
} from 'react-native';

interface KeyboardToolbarProps {
  children: React.ReactNode;
  backgroundColor?: string;
  borderTopColor?: string;
  borderTopWidth?: number;
  onDismissed?: () => void;
}

const KeyboardToolbar: React.FC<KeyboardToolbarProps> = ({
  onDismissed,
  children,
}) => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    let keyboardWillShowSub: EmitterSubscription;
    let keyboardWillHideSub: EmitterSubscription;
    let keyboardDidShowSub: EmitterSubscription;
    let keyboardDidHideSub: EmitterSubscription;

    if (Platform.OS === 'ios') {
      keyboardWillShowSub = Keyboard.addListener('keyboardWillShow', (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setIsKeyboardVisible(true);
      });

      keyboardWillHideSub = Keyboard.addListener('keyboardWillHide', () => {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
        onDismissed?.()
      });
    } else {
      // Android
      keyboardDidShowSub = Keyboard.addListener('keyboardDidShow', (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setIsKeyboardVisible(true);
      });

      keyboardDidHideSub = Keyboard.addListener('keyboardDidHide', () => {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
        onDismissed?.()
      });
    }

    return () => {
      keyboardWillShowSub?.remove();
      keyboardWillHideSub?.remove();
      keyboardDidShowSub?.remove();
      keyboardDidHideSub?.remove();
    };
  }, []);

  if (!isKeyboardVisible) {
    return null;
  }

  return (
    <View
      style={[
        styles.toolbar,
        {
          bottom: keyboardHeight - (Platform.OS === 'ios' ? 80 : 60),
        },
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  toolbar: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 1000,
  },
});

export default KeyboardToolbar;