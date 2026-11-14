import { DISMISS_DISTANCE_RATIO, DISMISS_VELOCITY, SPRING } from "@/constants/appConstants";
import { useWindowDimensions } from "react-native";
import { useCompetingGestures, usePanGesture, useTapGesture } from "react-native-gesture-handler";
import { SharedValue, withSpring } from "react-native-reanimated";

interface Params {
  dragX: SharedValue<number>;
  dragY: SharedValue<number>;
  closing: SharedValue<boolean>;
  animateClose: () => void;
  onTap: (x: number) => void;
}

/** Tap to advance, swipe down to close. */
export function useStackGestures({ dragX, dragY, closing, animateClose, onTap }: Params) {
  const { height: screenH } = useWindowDimensions();

  // Callbacks are defined inline so Gesture Handler workletizes them (UI thread).
  const pan = usePanGesture({
    activeOffsetY: [-10, 10],
    onUpdate: e => {
      if (closing.get()) return;
      dragX.set(e.translationX * 0.6);
      // Free drag downwards, heavy resistance upwards.
      dragY.set(e.translationY > 0 ? e.translationY : e.translationY * 0.15);
    },
    onDeactivate: e => {
      if (closing.get()) return;
      if (e.translationY > screenH * DISMISS_DISTANCE_RATIO || e.velocityY > DISMISS_VELOCITY) {
        animateClose();
      } else {
        dragX.set(withSpring(0, SPRING));
        dragY.set(withSpring(0, SPRING));
      }
    },
  });

  // onTap touches React state, so this one runs on the JS thread.
  const tap = useTapGesture({
    maxDistance: 10,
    runOnJS: true,
    onDeactivate: e => {
      if (!e.canceled) onTap(e.x);
    },
  });

  // Whichever activates first wins
  return useCompetingGestures(pan, tap);
}