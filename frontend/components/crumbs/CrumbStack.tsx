import { Crumb } from "@/api/models/crumb"; // adjust to wherever your Crumb type lives
import { crumbMedia } from "@/api/models/crumbMedia";
import { OriginRect } from "@/hooks/types/crumbStack";
import { useCrumbDeck } from "@/hooks/useCrumbDeck";
import { useOriginTransition } from "@/hooks/useOriginTransition";
import { useStackGestures } from "@/hooks/useStackGestures";
import { Modal, StyleSheet, useWindowDimensions, View } from "react-native";
import { GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import StackBackdrop from "./StackBackdrop";
import StackCard from "./StackCard";

interface CrumbStackProps {
  crumbs: Crumb[];
  origin: OriginRect;
  onClose: () => void;
  size?: number;
  blurIntensity?: number;
  onReveal?: (crumb: Crumb, media: crumbMedia, index: number) => void;
  onFinished?: () => void;
}

export function getCardDimensions(screenWidth: number, size?: number) {
  const cardSize = Math.min(size ?? screenWidth * 0.8, screenWidth * 0.85);
  const cardHeight = cardSize + cardSize / 4.75 + cardSize / 40;
  return { cardSize, cardHeight };
}

export default function CrumbStack({
  crumbs,
  origin,
  onClose,
  size,
  blurIntensity = 40,
  onReveal,
  onFinished,
}: CrumbStackProps) {
  const { width: screenW } = useWindowDimensions();
  const { cardSize, cardHeight } = getCardDimensions(screenW, size);

  const deck = useCrumbDeck(crumbs, onReveal);
  const { progress, dragX, dragY, closing, animateClose, stackStyle } = useOriginTransition(
    origin,
    cardSize,
    onClose
  );

  const handleTap = () => {
    if (deck.isAnimating || closing.get()) return;
    if (deck.isLast) {
      onFinished?.();
      animateClose();
      return;
    }
    deck.startExit();
  };

  const gesture = useStackGestures({ dragX, dragY, closing, animateClose, onTap: handleTap });

  return (
    <Modal
      transparent
      visible
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={animateClose}
    >
      <GestureHandlerRootView style={styles.fill}>
        <StackBackdrop progress={progress} dragY={dragY} intensity={blurIntensity} onPress={animateClose} />

        <View style={styles.center} pointerEvents="box-none">
          <GestureDetector gesture={gesture}>
            <Animated.View style={[{ width: cardSize, height: cardHeight }, stackStyle]}>
              {deck.visible
                .map(({ item, depth, exiting }) => (
                  <StackCard
                    key={item.key}
                    item={item}
                    depth={depth}
                    exiting={exiting}
                    size={cardSize}
                    onExited={deck.handleExited}
                  />
                ))
                .reverse()}
            </Animated.View>
          </GestureDetector>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
});