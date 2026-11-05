import { useStackCardAnimation } from "@/hooks/animations/useStackCardAnimation";
import { StackItem } from "@/hooks/types/crumbStack";
import { StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import CrumbView from "./CrumbView";

interface Props {
  item: StackItem;
  depth: number;
  exiting: boolean;
  size: number;
  onExited: () => void;
}

export default function StackCard({ item, depth, exiting, size, onExited }: Props) {
  const animatedStyle = useStackCardAnimation(item.index, depth, exiting, size, onExited);

  return (
    <Animated.View
      // let the gesture detector receive touches instead of CrumbView TextInput
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, styles.wrap, animatedStyle]}
    >
      <CrumbView type="readonly" media={item.media} size={size} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
});