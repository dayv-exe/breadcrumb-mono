import { EXIT_TIMING, RETURN_TIMING, SPRING, TILTS, VISIBLE_DEPTH } from "@/constants/appConstants";
import { useEffect } from "react";
import {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

interface Params {
  index: number;
  depth: number;
  exiting: boolean;
  returning: boolean;
  size: number;
  onExited: () => void;
  onReturned: () => void;
}

/**
 * A card's resting pose for its depth (tilt, scale, offset, fade at the back),
 * the fling-away when it's dismissed, and the reverse when it's brought back.
 */
export function useStackCardAnimation({
  index,
  depth,
  exiting,
  returning,
  size,
  onExited,
  onReturned,
}: Params) {
  const progress = useSharedValue(Math.min(depth + 1, VISIBLE_DEPTH));
  const exit = useSharedValue(returning ? 1 : 0);

  const tilt = TILTS[index % TILTS.length];
  const direction = index % 2 === 0 ? 1 : -1; // alternate fling direction

  useEffect(() => {
    progress.set(withSpring(depth, SPRING));
  }, [depth, progress]);

  useEffect(() => {
    if (!exiting) return;
    exit.set(
      withTiming(1, EXIT_TIMING, finished => {
        if (finished) scheduleOnRN(onExited);
      })
    );
  }, [exiting, exit, onExited]);

  useEffect(() => {
    if (!returning) return;
    exit.set(
      withTiming(0, RETURN_TIMING, finished => {
        if (finished) scheduleOnRN(onReturned);
      })
    );
  }, [returning, exit, onReturned]);

  return useAnimatedStyle(() => {
    const p = progress.get();
    const e = exit.get();

    const restingRotate = interpolate(p, [0, 1], [0, tilt], Extrapolation.CLAMP);
    const scale = interpolate(p, [0, VISIBLE_DEPTH], [1, 0.88], Extrapolation.CLAMP);
    const translateY = interpolate(p, [0, VISIBLE_DEPTH], [0, 18], Extrapolation.CLAMP);
    const depthOpacity = interpolate(p, [VISIBLE_DEPTH - 1, VISIBLE_DEPTH], [1, 0], Extrapolation.CLAMP);

    return {
      opacity: depthOpacity * (1 - e),
      transform: [
        { translateX: e * direction * size * 0.9 },
        { translateY: translateY - e * size * 0.15 },
        { rotate: `${restingRotate + e * direction * 18}deg` },
        { scale: scale * (1 - e * 0.05) },
      ],
    };
  });
}