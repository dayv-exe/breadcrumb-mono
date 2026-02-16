import { useEffect, useState } from "react";
import { Dimensions, Keyboard, Platform } from "react-native";

export function useKeyboardHeight() {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const screenHeight = Dimensions.get("window").height;
    const center = screenHeight / 2;

    const updateHeight = (e: any) => {
      const keyboardTop = screenHeight - e.endCoordinates.height;
      setHeight(keyboardTop - center);
    };

    const reset = () => setHeight(0);

    const listeners = Platform.OS === "ios"
      ? [
        Keyboard.addListener("keyboardWillShow", updateHeight),
        Keyboard.addListener("keyboardWillHide", reset),
        Keyboard.addListener("keyboardWillChangeFrame", updateHeight),
      ]
      : [
        Keyboard.addListener("keyboardDidShow", updateHeight),
        Keyboard.addListener("keyboardDidHide", reset),
        Keyboard.addListener("keyboardDidChangeFrame", updateHeight),
      ];

    return () => listeners.forEach((l) => l.remove());
  }, []);

  return height;
}