import { useVideoPlayer, VideoView } from 'expo-video';
import { Image, StyleSheet, View } from "react-native";
import CustomButton from "../buttons/CustomButton";
import Spacer from "../Spacer";

type MediaPreview = {
  type: 'photo' | 'video';
  uri: string;
};

type PreviewScreenProps = {
  media: MediaPreview;
  onRetake: () => void;
  onSave: () => void;
};

export default function PreviewScreen({ media, onRetake, onSave }: PreviewScreenProps) {
  const player = useVideoPlayer(
    media.type === 'video' ? media.uri : '', 
    (player) => {
      if (media.type === 'video') {
        player.loop = true;
        player.play();
      }
    }
  );

  return (
    <View style={previewStyles.container}>
      <View style={previewStyles.mediaWrapper}>
        {media.type === 'photo' ? (
          <Image
            source={{ uri: media.uri }}
            style={previewStyles.media}
            resizeMode="cover"
          />
        ) : (
          <VideoView
            player={player!}
            style={previewStyles.media}
            contentFit="cover"
            nativeControls={false}
          />
        )}
      </View>

      <View style={previewStyles.controls}>
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
  );
}

const previewStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  mediaWrapper: {
    flex: 1,
    width: "100%",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: "hidden",
  },
  media: {
    width: "100%",
    height: "100%",
  },
  controls: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
});