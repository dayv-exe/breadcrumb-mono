import { BlurView } from "expo-blur";
import { memo } from "react";
import { Platform, StyleSheet, useWindowDimensions } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
} from "react-native-reanimated";

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

interface Props {
  progress: SharedValue<number>;
  dragY: SharedValue<number>;
  intensity: number;
}

export default memo(function StackBackdrop({ progress, dragY, intensity }: Props) {
  const { height: screenH } = useWindowDimensions();

  const amount = () => {
    "worklet";
    const dragFade = interpolate(dragY.get(), [0, screenH * 0.4], [1, 0.25], Extrapolation.CLAMP);
    return progress.get() * dragFade;
  };

  const blurProps = useAnimatedProps(() => ({ intensity: intensity * amount() }));
  const dimStyle = useAnimatedStyle(() => ({ opacity: amount() }));

  return (
    <>
      <AnimatedBlurView
        animatedProps={blurProps}
        tint="dark"
        blurMethod={Platform.OS === "android" ? "dimezisBlurView" : undefined}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View pointerEvents="none" style={[StyleSheet .absoluteFill, styles.dim, dimStyle]} />
    </>
  );
});

const styles = StyleSheet.create({
  dim: { backgroundColor: "rgba(0, 0, 0, 0.3)" },
});