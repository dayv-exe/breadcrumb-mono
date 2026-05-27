import { MediaData } from "@/constants/media";
import { AudioLinesIcon, PlayIcon, TextIcon } from "lucide-react-native";
import { Image, StyleSheet, View } from "react-native";
import CustomLabel from "../CustomLabel";

type props = {
  src: string;
  index: number;
  active?: boolean;
  media: MediaData
};

const maxTwists = 2;

export default function PreviewCard({ src, index, active, media }: props) {
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
            { translateX: index < maxTwists ? index * 2 : maxTwists * 2 }, 
          ],
        },
      ]}
    >
      <Image src={src} style={styles.image} />
      <View style={[styles.text, {
        borderColor: "#fff",
        borderWidth: active ? 1 : 0,
        backgroundColor: media.type !== "photo" && media.type !== "video" ? "gray" : "undefined"
      }]}>
        {index > 0 && (
          <CustomLabel fontSize={21} labelText={String(index + 1)} />
        )}
      </View>
      {
        media.type === "text" &&
        <TextIcon style={{
          position: 'absolute',
          alignSelf: "center",
          top: 32,
          zIndex: index,
        }} size={30} color="#fff" />
      }
      {
        media.type === "audio" &&
        <AudioLinesIcon style={{
          position: 'absolute',
          alignSelf: "center",
          top: 32,
          zIndex: index,
        }} size={30} color="#fff" />
      }
      {
        media.type === "video" &&
        <PlayIcon style={{
          position: 'absolute',
          alignSelf: "center",
          top: 32,
          zIndex: index,
        }} size={30} color="#fff" fill="#fff" />
      }
    </View>
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
