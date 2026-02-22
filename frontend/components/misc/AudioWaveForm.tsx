import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Rect } from "react-native-svg";

const AnimatedRect = Animated.createAnimatedComponent(Rect);

type Props = {
  size?: number;
  color?: string;
  backgroundColor?: string;
  animating?: boolean;
};

const ELEMENTS = [
  { cx: 15, restHeight: 28 },
  { cx: 33, restHeight: 50 },
  { cx: 51, restHeight: 80 },
  { cx: 69, restHeight: 55 },
  { cx: 87, restHeight: 35 },
] as const;

const BAR_WIDTH = 10;
const BAR_RADIUS = 5;
const VIEWBOX = 110;

function AnimatedBar({
  cx,
  restHeight,
  index,
  isAnimating,
  color,
}: {
  cx: number;
  restHeight: number;
  index: number;
  isAnimating: boolean;
  color: string;
}) {
  const heightSV = useSharedValue(restHeight);

  useEffect(() => {
    if (isAnimating) {
      const min = Math.max(restHeight * 0.3, 12);
      const max = Math.min(restHeight * 1.5, 90);
      const duration = 400 + index * 60;

      heightSV.value = withDelay(
        index * 100,
        withRepeat(
          withSequence(
            withTiming(max, { duration, easing: Easing.inOut(Easing.ease) }),
            withTiming(min, { duration, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        )
      );
    } else {
      cancelAnimation(heightSV);
      heightSV.value = withTiming(restHeight, { duration: 300 });
    }
  }, [isAnimating]);

  const animatedProps = useAnimatedProps(() => {
    const h = heightSV.value;
    return {
      height: h,
      y: (VIEWBOX - h) / 2,
    };
  });

  return (
    <AnimatedRect
      animatedProps={animatedProps}
      x={cx - BAR_WIDTH / 2}
      width={BAR_WIDTH}
      rx={BAR_RADIUS}
      ry={BAR_RADIUS}
      fill={color}
    />
  );
}

export default function AudioWaveIcon({
  size = 64,
  color = "#FFFFFF",
  backgroundColor = "#000000",
  animating = false,
}: Props) {
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size * 0.22,
          backgroundColor,
        },
      ]}
    >
      <Svg
        width={size * 0.75}
        height={size * 0.75}
        viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      >
        {ELEMENTS.map((el, i) => (
          <AnimatedBar
            key={i}
            cx={el.cx}
            restHeight={el.restHeight}
            index={i}
            isAnimating={animating}
            color={color}
          />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});