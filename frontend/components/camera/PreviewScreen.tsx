import { useVideoPlayer, VideoView } from "expo-video";
import { Image, StyleSheet, View } from "react-native";
import CustomButton from "../buttons/CustomButton";
import Spacer from "../Spacer";

type MediaPreview = {
  type: 'photo' | 'video'
  uri: string
}

type PreviewScreenProps = {
  media: MediaPreview
  onRetake: () => void
  onSave: () => void
}

export default function PreviewScreen({ media, onRetake, onSave }: PreviewScreenProps) {
  const player = useVideoPlayer(media.type === 'video' ? media.uri : '', player => {
    if (media.type === 'video') {
      player.loop = false;
      player.currentTime = 0
      player.play();
    }
  });

  player.addListener("playToEnd", () => {
    player.currentTime = 0
    player.play()
  })

  return (
    <View style={styles.previewContainer}>
      <View style={styles.previewMediaWrapper}>
        {media.type === 'photo' ? (
          <Image
            source={{ uri: media.uri }}
            style={styles.previewMedia}
            resizeMode="cover"
          />
        ) : (
          <VideoView
            player={player!}
            style={styles.previewMedia}
            contentFit="cover"
            nativeControls={false}
          />
        )}
      </View>

      <View style={styles.previewControls}>
        <CustomButton
          type="text"
          labelText="Retake"
          handleClick={onRetake}
        />
        <Spacer size="medium" />
        <CustomButton
          type="prominent"
          labelText="Save"
          handleClick={onSave}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  previewContainer: {
    flex: 1,
    backgroundColor: "black",
  },
  previewMediaWrapper: {
    flex: 1,
    width: "100%",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: "hidden",
  },
  previewMedia: {
    width: "100%",
    height: "100%",
  },
  previewControls: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
})