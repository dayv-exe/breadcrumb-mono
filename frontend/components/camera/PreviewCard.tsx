import { MediaData } from "@/constants/media";
import { AudioLinesIcon, PlayIcon, TextIcon } from "lucide-react-native";
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
  active?: boolean;
  media: MediaData;
  /** true for the most recently added card — plays the drop-in animation on mount */
  animateIn?: boolean;
};

const maxTwists = 2;

const ENTER_SPRING = { damping: 100, stiffness: 500, mass: .25 };

export default function PreviewCard({ src, index, active, media, animateIn }: props) {
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
        styles.container,
        {
          zIndex: index,
          transform: [{ rotate }, { translateX }],
        },
      ]}
    >
      <Image src={src} style={styles.image} />
      <View
        style={[
          styles.text,
          {
            borderColor: "#fff",
            borderWidth: active ? 1 : 0,
            backgroundColor:
              media.type !== "photo" && media.type !== "video"
                ? "gray"
                : "undefined",
          },
        ]}
      >
        {index > 0 && (
          <CustomLabel fontSize={21} labelText={String(index + 1)} />
        )}
      </View>
      {media.type === "text" && (
        <TextIcon
          style={{
            position: "absolute",
            alignSelf: "center",
            top: 32,
            zIndex: index,
          }}
          size={30}
          color="#fff"
        />
      )}
      {media.type === "audio" && (
        <AudioLinesIcon
          style={{
            position: "absolute",
            alignSelf: "center",
            top: 32,
            zIndex: index,
          }}
          size={30}
          color="#fff"
        />
      )}
      {media.type === "video" && (
        <PlayIcon
          style={{
            position: "absolute",
            alignSelf: "center",
            top: 32,
            zIndex: index,
          }}
          size={30}
          color="#fff"
          fill="#fff"
        />
      )}
    </Reanimated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    overflow: "hidden",
    width: 1080 * 0.05,
    height: 1920 * 0.05,
  },
  image: {
    borderRadius: 10,
    height: 1920 * 0.05,
    width: 1080 * 0.05,
  },
  text: {
    position: "absolute",

    width: 1080 * 0.05,
    height: 1920 * 0.05,
    backgroundColor: "rgba(0, 0, 0, .25)",
    borderRadius: 10,
  },
});