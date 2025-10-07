import { Colors } from "@/constants/Colors";
import Reanimated, { useAnimatedProps, useSharedValue } from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

const AnimatedCircle = Reanimated.createAnimatedComponent(Circle);

type ProgressRingProps = {
  progress: ReturnType<typeof useSharedValue<number>>;
  size: number;
  strokeWidth?: number;
};

export default function RecordingProgressRing({ progress, size, strokeWidth = 8 }: ProgressRingProps) {
  const radius = (size + strokeWidth) / 2
  const circumference = 2 * Math.PI * radius;
  const svgSize = radius * 2

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <Svg
      width={svgSize}
      height={svgSize}
      style={{
        position: "absolute",
      }}
    >
      <AnimatedCircle
        cx={svgSize / 2}
        cy={svgSize / 2}
        r={radius - strokeWidth / 2}
        stroke={Colors.light.backgroundOverlay}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        animatedProps={animatedProps}
        strokeLinecap="round"
        fill="transparent"
        transform={`rotate(-90 ${svgSize / 2} ${svgSize / 2})`}
      />
    </Svg>
  );
}
