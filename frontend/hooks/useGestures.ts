import { useMemo } from "react";
import { Gesture } from "react-native-gesture-handler";
import { scheduleOnRN } from "react-native-worklets";

type UseGestureOptions = {
  onTap?: (pos: { x: number; y: number }) => void;
};

export function useGesture({ onTap }: UseGestureOptions = {}) {
  const gesture = useMemo(() => {
    const tap = Gesture.Tap().onEnd((e, success) => {
      if (success && onTap) {
        scheduleOnRN(onTap, { x: e.x, y: e.y });
      }
    });
    return Gesture.Exclusive(tap);
  }, [onTap]);

  return { gesture };
}
