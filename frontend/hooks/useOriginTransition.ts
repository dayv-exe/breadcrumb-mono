import { CLOSE_TIMING, OPEN_TIMING } from "@/constants/appConstants";
import { useCallback, useEffect } from "react";
import { useWindowDimensions } from "react-native";
import {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { OriginRect } from "./types/crumbStack";

/**
 * Grows the stack out of `origin` on mount, and shrinks it back into `origin`
 * on close, blending in any drag offset so a swipe-down closes from where the finger let go.
 */
export function useOriginTransition(origin: OriginRect, cardSize: number, onClose: () => void) {
  const { width: screenW, height: screenH } = useWindowDimensions();

  const progress = useSharedValue(0); // 0 = shrunk into origin, 1 = fully open
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const closing = useSharedValue(false);

  useEffect(() => {
    progress.set(withTiming(1, OPEN_TIMING));
  }, [progress]);

  // Transform that puts the stack's centre on the origin's centre at the origin's size.
  const originDx = origin.x + origin.width / 2 - screenW / 2;
  const originDy = origin.y + origin.height / 2 - screenH / 2;
  const originScale = origin.width / cardSize;

  // Stable reference so the memoized backdrop doesn't re-render on every card tap.
  const animateClose = useCallback(() => {
    "worklet";
    if (closing.get()) return;
    closing.set(true);
    progress.set(
      withTiming(0, CLOSE_TIMING, finished => {
        if (finished) scheduleOnRN(onClose);
      })
    );
  }, [closing, progress, onClose]);

  const stackStyle = useAnimatedStyle(() => {
    const p = progress.get();
    const dragScale = interpolate(dragY.get(), [0, screenH], [1, 0.6], Extrapolation.CLAMP);
    return {
      // Fade out over the last stretch so it hands off cleanly to the real thumbnail.
      opacity: interpolate(p, [0, 0.12], [0, 1], Extrapolation.CLAMP),
      transform: [
        { translateX: interpolate(p, [0, 1], [originDx, dragX.get()]) },
        { translateY: interpolate(p, [0, 1], [originDy, dragY.get()]) },
        { scale: interpolate(p, [0, 1], [originScale, dragScale]) },
      ],
    };
  });

  return { progress, dragX, dragY, closing, animateClose, stackStyle };
}