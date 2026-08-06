import { MediaData } from "@/constants/media";
import { Image, StyleSheet, View } from "react-native";
import Reanimated, {
  EntryAnimationsValues,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import CustomLabel from "../CustomLabel";

type props = {
  src: string;
  index: number;
  size: number
  media: MediaData;
  /** true for the most recently added card — plays the drop-in animation on mount */
  animateIn?: boolean;
};

const maxTwists = 1;

const ENTER_SPRING = { damping: 100, stiffness: 500, mass: .25 };

export default function SmallPreviewCard({ src, index, size, media, animateIn }: props) {
  // the card's resting transform in the stack
  const rotate = index < maxTwists ? `${index * 7}deg` : `${maxTwists * 7}deg`;
  const translateX = index < maxTwists ? index * 2 : maxTwists * 2;

  // drop-in: starts big and lifted, springs down into its slot
  const cardEnter = (values: EntryAnimationsValues) => {
    "worklet";
    return {
      initialValues: {
        opacity: 0,
        transform: [
          { rotate },
          { translateX },
          { translateY: -40 },
          { scale: 1.7 },
        ],
      },
      animations: {
        opacity: withTiming(1, { duration: 120 }),
        transform: [
          { rotate },
          { translateX },
          { translateY: withSpring(0, ENTER_SPRING) },
          { scale: withSpring(1, ENTER_SPRING) },
        ],
      },
    };
  };

  return (
    <Reanimated.View
      entering={animateIn ? cardEnter : undefined}
      style={[
        styles.wrapper,
        {
          zIndex: index,
          transform: [{ rotate }, { translateX }],
        },
      ]}
    >
      <View
        style={[styles.container, {
          outlineWidth: size / 150,
          outlineColor: "#000000",
          borderWidth: size / 10,
          borderBottomWidth: size / 3.5,
          borderColor: "#FFFFFF",
        }]}
      >
        <View
          style={[
            styles.text,
            {
              backgroundColor: "gray",
              alignItems: "center",
              justifyContent: "center",
              height: size,
              width: size,
            },
          ]}
        />

        <Image src={src} style={[styles.image, {
          width: size,
          height: size,
        }]} />
        <View
          style={[
            styles.text,
            {
              backgroundColor: "rgba(0, 0, 0, .25)",
              alignItems: "center",
              justifyContent: "center",
              height: size,
              width: size,
            },
          ]}
        >
          {index > -1 && (
            <CustomLabel bold fontSize={size / 1.25} labelText={String(index + 1)} customStyle={{
              padding: 0,
            }} />
          )}
        </View>
      </View>
    </Reanimated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    overflow: "hidden",
  },
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
  },
  text: {
    alignSelf: "center",
    position: "absolute",
  },
});