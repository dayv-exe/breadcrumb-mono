// CropGestureContainer.tsx
import { CropTransform } from "@/constants/media";
import React, { useCallback } from "react";
import { StyleSheet, ViewStyle } from "react-native";
import {
  Gesture,
  GestureDetector
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

const MIN_SCALE = 1;
const MAX_SCALE = 5;

type Props = {
  cropTransform: CropTransform;
  onCropChange?: (crop: CropTransform) => void;
  containerWidth: number;
  containerHeight: number;
  imageWidth: number;
  imageHeight: number;
  resizeMode: "cover" | "contain";
  children: React.ReactNode;
  style?: ViewStyle;
};

function getDisplayedImageSize(
  imageWidth: number,
  imageHeight: number,
  containerWidth: number,
  containerHeight: number,
  resizeMode: "cover" | "contain"
): { width: number; height: number } {
  "worklet";
  const imageAspect = imageWidth / imageHeight;
  const containerAspect = containerWidth / containerHeight;

  if (resizeMode === "cover") {
    // Image fills container, may overflow on one axis
    if (imageAspect > containerAspect) {
      // Image is wider — height fills, width overflows
      return { width: containerHeight * imageAspect, height: containerHeight };
    } else {
      // Image is taller — width fills, height overflows
      return { width: containerWidth, height: containerWidth / imageAspect };
    }
  } else {
    // contain: image fits inside, may have letterbox
    if (imageAspect > containerAspect) {
      return { width: containerWidth, height: containerWidth / imageAspect };
    } else {
      return { width: containerHeight * imageAspect, height: containerHeight };
    }
  }
}

export default function CropGestureContainer({
  cropTransform,
  onCropChange,
  containerWidth,
  containerHeight,
  imageWidth,
  imageHeight,
  children,
  resizeMode,
  style,
}: Props) {
  // Current committed values (from source of truth)
  const scale = useSharedValue(cropTransform.scale);
  const translateX = useSharedValue(cropTransform.translateX);
  const translateY = useSharedValue(cropTransform.translateY);

  // Saved values at gesture start
  const savedScale = useSharedValue(cropTransform.scale);
  const savedTranslateX = useSharedValue(cropTransform.translateX);
  const savedTranslateY = useSharedValue(cropTransform.translateY);

  // Focal point offset from pinch
  const focalOffsetX = useSharedValue(0);
  const focalOffsetY = useSharedValue(0);

  /**
   * Clamp translation so the image always covers the container.
   * When scale > 1 the image is larger than the container,
   * so we allow panning up to the overflow on each axis.
   */
  const clampTranslate = useCallback(
  (tx: number, ty: number, s: number) => {
    "worklet";
    const displayed = getDisplayedImageSize(
      imageWidth,
      imageHeight,
      containerWidth,
      containerHeight,
      resizeMode
    );

    // How much the scaled image exceeds the container on each axis
    const overflowX = Math.max(0, (displayed.width * s - containerWidth) / 2);
    const overflowY = Math.max(0, (displayed.height * s - containerHeight) / 2);

    const clampedX = Math.min(overflowX, Math.max(-overflowX, tx));
    const clampedY = Math.min(overflowY, Math.max(-overflowY, ty));

    return { x: clampedX, y: clampedY };
  },
  [containerWidth, containerHeight, imageWidth, imageHeight, resizeMode]
);

  const commitCrop = useCallback(
    (s: number, tx: number, ty: number) => {
      onCropChange?.({ scale: s, translateX: tx, translateY: ty });
    },
    [onCropChange]
  );

  // --- Pinch gesture (zoom) ---
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      focalOffsetX.value = 0;
      focalOffsetY.value = 0;
    })
    .onUpdate((e) => {
      const newScale = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, savedScale.value * e.scale)
      );
      scale.value = newScale;

      // Adjust translation relative to focal point
      const clamped = clampTranslate(
        savedTranslateX.value + e.focalX - containerWidth / 2,
        savedTranslateY.value + e.focalY - containerHeight / 2,
        newScale
      );

      // Only use focal offset for smooth feel, don't jump
      translateX.value = clamped.x;
      translateY.value = clamped.y;
    })
    .onEnd(() => {
      // Snap back to min scale if below
      if (scale.value < MIN_SCALE) {
        scale.value = MIN_SCALE
        translateX.value = 0
        translateY.value = 0
        scheduleOnRN(commitCrop, MIN_SCALE, 0, 0)
      } else {
        const clamped = clampTranslate(
          translateX.value,
          translateY.value,
          scale.value
        );
        translateX.value = clamped.x
        translateY.value = clamped.y
        scheduleOnRN(commitCrop, scale.value, clamped.x, clamped.y);
      }
    });

  // --- Pan gesture (move) ---
  const panGesture = Gesture.Pan()
    .minPointers(1)
    .maxPointers(2)
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((e) => {
      const clamped = clampTranslate(
        savedTranslateX.value + e.translationX,
        savedTranslateY.value + e.translationY,
        scale.value
      );
      translateX.value = clamped.x;
      translateY.value = clamped.y;
    })
    .onEnd(() => {
      const clamped = clampTranslate(
        translateX.value,
        translateY.value,
        scale.value
      );
      translateX.value = clamped.x
      translateY.value = clamped.y
      scheduleOnRN(commitCrop, scale.value, clamped.x, clamped.y)
    });

  // --- Double tap to reset ---
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      scale.value = MIN_SCALE
      translateX.value = 0
      translateY.value = 0
      scheduleOnRN(commitCrop, MIN_SCALE, 0, 0)
    });

  // Compose gestures: pinch + pan simultaneously, double tap separate
  const gesture = Gesture.Simultaneous(
    pinchGesture,
    panGesture
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          styles.container,
          style,
          { width: containerWidth, height: containerHeight, overflow: "hidden" },
        ]}
      >
        <Animated.View
          style={[
            { width: containerWidth, height: containerHeight },
            animatedStyle,
          ]}
        >
          {children}
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  inner: {
    justifyContent: "center",
    alignItems: "center",
  },
});