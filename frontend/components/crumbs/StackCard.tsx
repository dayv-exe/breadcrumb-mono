import { useStackCardAnimation } from "@/hooks/animations/useStackCardAnimation";
import { StackItem } from "@/hooks/types/crumbStack";
import { StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import CrumbView from "./CrumbView";


interface Props {
  item: StackItem;
  depth: number;
  exiting: boolean;
  returning: boolean;
  size: number;
  onExited: () => void;
  onReturned: () => void;
}

export default function StackCard({ item, depth, exiting, returning, size, onExited, onReturned }: Props) {
  const animatedStyle = useStackCardAnimation({
    index: item.index,
    depth,
    exiting,
    returning,
    size,
    onExited,
    onReturned,
  });

  return (
    <Animated.View
      // Let the gesture detector receive touches instead of CrumbView's TextInput.
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