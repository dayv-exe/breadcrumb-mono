import { OverlayTransform } from "@/constants/media";
import { useKeyboardHeight } from "@/hooks/useKeyboardHeight";
import React, { useCallback, useEffect, useState } from "react";
import {
  LayoutChangeEvent,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

type TransformLocks = {
  /** Prevent horizontal movement */
  lockX?: boolean;
  /** Prevent vertical movement */
  lockY?: boolean;
  /** Prevent scaling */
  lockScale?: boolean;
  /** Prevent rotation */
  lockRotation?: boolean;
};

type DraggableItemProps = {
  initialTransform: OverlayTransform;
  onTransformEnd?: (transform: OverlayTransform) => void;
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  /** Fired when a pan gesture begins */
  onDragStart?: () => void;
  /** Fired continuously during pan with the finger's absolute screen position */
  onDragMove?: (absoluteX: number, absoluteY: number) => void;
  /** Fired when the pan gesture ends with the finger's final absolute position */
  onDragEnd?: (absoluteX: number, absoluteY: number) => void;
  enabled?: boolean;
  locks?: TransformLocks;
  style?: ViewStyle;
  children: React.ReactNode;
  centerMode?: boolean;
};

export default function DraggableItem({
  initialTransform,
  onTransformEnd,
  onTap,
  onDoubleTap,
  onLongPress,
  onDragStart,
  onDragMove,
  onDragEnd,
  enabled = true,
  locks = {},
  style,
  children,
  centerMode = false,
}: DraggableItemProps) {
  const { lockX = false, lockY = false, lockScale = false, lockRotation = false } = locks;

  const [size, setSize] = useState({ width: 0, height: 0 });

  // --- Current transform ---
  const translateX = useSharedValue(initialTransform.x);
  const translateY = useSharedValue(initialTransform.y);
  const scale = useSharedValue(initialTransform.scale);
  const rotation = useSharedValue(initialTransform.rotation);

  // --- Saved values at gesture start ---
  const savedTranslateX = useSharedValue(initialTransform.x);
  const savedTranslateY = useSharedValue(initialTransform.y);
  const savedScale = useSharedValue(initialTransform.scale);
  const savedRotation = useSharedValue(initialTransform.rotation);

  // --- Saved original transform for centerMode ---
  const originalTransform = useSharedValue({
    x: initialTransform.x,
    y: initialTransform.y,
    scale: initialTransform.scale,
    rotation: initialTransform.rotation,
  });

  const height = useKeyboardHeight();

  useEffect(() => {
    if (centerMode) {
      originalTransform.value = {
        x: translateX.value,
        y: translateY.value,
        scale: scale.value,
        rotation: rotation.value,
      };

      translateX.value = withTiming(0, { duration: 100 });
      translateY.value = withTiming(height - 75, { duration: 100 });
      scale.value = withTiming(1, { duration: 100 });
      rotation.value = withTiming(0, { duration: 100 });
    } else {
      translateX.value = withTiming(originalTransform.value.x, { duration: 100 });
      translateY.value = withTiming(originalTransform.value.y, { duration: 100 });
      scale.value = withTiming(originalTransform.value.scale, { duration: 100 });
      rotation.value = withTiming(originalTransform.value.rotation, { duration: 100 });
    }
  }, [centerMode]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  };

  const emitTransformEnd = useCallback(
    (x: number, y: number, s: number, r: number) => {
      onTransformEnd?.({ x, y, scale: s, rotation: r });
    },
    [onTransformEnd]
  );

  const gesturesEnabled = enabled && !centerMode;

  // --- Pan ---
  const panGesture = Gesture.Pan()
    .enabled(gesturesEnabled && (!lockX || !lockY))
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      if (onDragStart) runOnJS(onDragStart)();
    })
    .onUpdate((e) => {
      if (!lockX) translateX.value = savedTranslateX.value + e.translationX;
      if (!lockY) translateY.value = savedTranslateY.value + e.translationY;
      if (onDragMove) runOnJS(onDragMove)(e.absoluteX, e.absoluteY);
    })
    .onEnd((e) => {
      if (onDragEnd) runOnJS(onDragEnd)(e.absoluteX, e.absoluteY);
      scheduleOnRN(
        emitTransformEnd,
        translateX.value,
        translateY.value,
        scale.value,
        rotation.value
      );
    });

  // --- Pinch ---
  const pinchGesture = Gesture.Pinch()
    .enabled(gesturesEnabled && !lockScale)
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      scale.value = Math.max(0.2, Math.min(scale.value, 5));
      scheduleOnRN(
        emitTransformEnd,
        translateX.value,
        translateY.value,
        scale.value,
        rotation.value
      );
    });

  // --- Rotation ---
  const rotationGesture = Gesture.Rotation()
    .enabled(gesturesEnabled && !lockRotation)
    .onStart(() => {
      savedRotation.value = rotation.value;
    })
    .onUpdate((e) => {
      rotation.value = savedRotation.value + e.rotation;
    })
    .onEnd(() => {
      scheduleOnRN(
        emitTransformEnd,
        translateX.value,
        translateY.value,
        scale.value,
        rotation.value
      );
    });

  // --- Tap ---
  const tapGesture = Gesture.Tap()
    .enabled(gesturesEnabled)
    .maxDuration(250)
    .onEnd((_e, success) => {
      if (success && onTap) scheduleOnRN(onTap);
    });

  // --- Double tap ---
  const doubleTapGesture = Gesture.Tap()
    .enabled(gesturesEnabled)
    .numberOfTaps(2)
    .maxDuration(250)
    .onEnd((_e, success) => {
      if (success && onDoubleTap) scheduleOnRN(onDoubleTap);
    });

  // --- Long press ---
  const longPressGesture = Gesture.LongPress()
    .enabled(gesturesEnabled)
    .minDuration(500)
    .onEnd((_e, success) => {
      if (success && onLongPress) scheduleOnRN(onLongPress);
    });

  const composedGesture = Gesture.Race(
    doubleTapGesture,
    tapGesture,
    longPressGesture,
    Gesture.Simultaneous(panGesture, pinchGesture, rotationGesture)
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -size.width / 2 },
      { translateY: -size.height / 2 },
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}rad` },
    ],
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View
        onLayout={onLayout}
        style={[
          styles.container,
          style,
          {
            left: "50%",
            top: "50%",
          },
          animatedStyle,
        ]}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
  },
});