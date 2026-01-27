import { Image, StyleSheet, View } from "react-native";
import CustomLabel from "../CustomLabel";

type props = {
  src: string;
  index: number;
  active?: boolean;
};

const maxTwists = 2;

export default function PreviewCard({ src, index, active }: props) {
  return (
    <View
      style={[
        styles.container,
        {
          zIndex: index,
          transform: [
            {
              rotate:
                index < maxTwists ? `${index * 7}deg` : `${maxTwists * 7}deg`,
            }, // adjust rotation amount
            { translateX: index < maxTwists ? index * 2 : maxTwists * 2 }, // optional: slight offset
          ],
        },
      ]}
    >
      <Image src={src} style={styles.image} />
      <View style={[styles.text, {
        borderColor: "#fff",
        borderWidth: active ? 1 : 0
      }]}>
        {index > 0 && (
          <CustomLabel fontSize={21} labelText={String(index + 1)} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute", // stack on top of each other
    overflow: "hidden",
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
