import { BlurView } from "expo-blur";
import { Platform, Pressable, StyleSheet, useWindowDimensions } from "react-native";
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
  onPress: () => void;
}

export default function StackBackdrop({ progress, dragY, intensity, onPress }: Props) {
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
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.dim, dimStyle]} />
      <Pressable style={StyleSheet.absoluteFill} onPress={onPress} />
    </>
  );
}

const styles = StyleSheet.create({
  dim: { backgroundColor: "rgba(0, 0, 0, 0.3)" },
});