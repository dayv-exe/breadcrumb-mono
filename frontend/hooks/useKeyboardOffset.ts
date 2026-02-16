// hooks/useKeyboardOffset.ts
import { useEffect, useRef } from "react";
import { Animated, Keyboard } from "react-native";

type UseKeyboardOffsetOptions = {
  /**
   * How much to offset by. Can be:
   * - A number (fixed pixels)
   * - A function that receives keyboard height and returns offset
   * @default (keyboardHeight) => -keyboardHeight / 2
   */
  offsetCalculator?: number | ((keyboardHeight: number) => number);
  /**
   * Animation duration in milliseconds
   * If not provided, uses the keyboard's native duration
   */
  duration?: number;
  /**
   * Whether to enable the offset
   * @default true
   */
  enabled?: boolean;
};

export function useKeyboardOffset(options: UseKeyboardOffsetOptions = {}) {
  const {
    offsetCalculator = (keyboardHeight: number) => -keyboardHeight / 2,
    duration,
    enabled = true,
  } = options;

  const keyboardOffset = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!enabled) return;

    const keyboardWillShow = Keyboard.addListener(
      "keyboardWillShow",
      (e) => {
        const offset =
          typeof offsetCalculator === "number"
            ? offsetCalculator
            : offsetCalculator(e.endCoordinates.height);

        Animated.timing(keyboardOffset, {
          toValue: offset,
          duration: duration ?? e.duration,
          useNativeDriver: true,
        }).start();
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      "keyboardWillHide",
      (e) => {
        Animated.timing(keyboardOffset, {
          toValue: 0,
          duration: duration ?? e.duration,
          useNativeDriver: true,
        }).start();
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, [keyboardOffset, offsetCalculator, duration, enabled]);

  return keyboardOffset;
}