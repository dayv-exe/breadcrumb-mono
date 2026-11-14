import { Crumb } from "@/api/models/crumb"; // adjust to wherever your Crumb type lives
import { Media } from "@/api/models/media";
import { BACK_ZONE_RATIO, FN_GET_CARD_DIMENSIONS } from "@/constants/appConstants";
import { OriginRect } from "@/hooks/types/crumbStack";
import { useCrumbDeck } from "@/hooks/useCrumbDeck";
import { useOriginTransition } from "@/hooks/useOriginTransition";
import { useStackGestures } from "@/hooks/useStackGestures";
import { Modal, StyleSheet, useWindowDimensions, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import StackBackdrop from "./StackBackdrop";
import StackCard from "./StackCard";

interface CrumbStackProps {
  crumbs: Crumb[];
  media: Media[]
  origin: OriginRect;
  onClose: () => void;
  size?: number;
  blurIntensity?: number;
  onReveal?: (crumb: Crumb, media: Media, index: number) => void;
  onFinished?: () => void;
}

export default function CrumbStack({
  crumbs,
  media,
  origin,
  onClose,
  size,
  blurIntensity = 40,
  onReveal,
  onFinished,
}: CrumbStackProps) {
  const { width: screenW } = useWindowDimensions();
  const { cardSize, cardHeight } = FN_GET_CARD_DIMENSIONS(screenW, size);

  const deck = useCrumbDeck(crumbs, media, onReveal);
  const { progress, dragX, dragY, closing, animateClose, stackStyle } = useOriginTransition(
    origin,
    cardSize,
    onClose
  );

  const handleTap = (x: number) => {
    if (deck.isAnimating || closing.get()) return;

    if (x < screenW * BACK_ZONE_RATIO) {
      deck.goBack();
      return;
    }
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
      <GestureDetector gesture={gesture}>
        <View style={styles.fill}>
          <StackBackdrop progress={progress} dragY={dragY} intensity={blurIntensity} />

          <View style={styles.center} pointerEvents="none">
            <Animated.View style={[{ width: cardSize, height: cardHeight }, stackStyle]}>
              {deck.visible
                .map(({ item, depth, exiting, returning }) => (
                  <StackCard
                    key={item.key}
                    item={item}
                    depth={depth}
                    exiting={exiting}
                    returning={returning}
                    size={cardSize}
                    onExited={deck.handleExited}
                    onReturned={deck.handleReturned}
                  />
                ))
                .reverse()}
            </Animated.View>
          </View>
        </View>
      </GestureDetector>
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