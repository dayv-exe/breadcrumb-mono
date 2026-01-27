import { MediaData } from "@/constants/media";
import { useMediaStore } from "@/utils/mediaStore";
import { useVideoPlayer, VideoView } from "expo-video";
import { useCallback, useEffect } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type PreviewScreenProps = {
  mediaItems: MediaData[];
  onRetake: () => void;
  onSave: (selectedIndex: number) => void;
};

const THUMBNAIL_SIZE = 60;
const THUMBNAIL_SPACING = 8;

function VideoPreview({ uri, isActive }: { uri: string; isActive: boolean }) {
  const player = useVideoPlayer(uri, (player) => {
    player.loop = true;
    player.currentTime = 0;
    if (isActive) {
      player.play();
    }
  });

  useEffect(() => {
    if (isActive) {
      player.currentTime = 0;
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, player]);

  return (
    <VideoView
      player={player}
      style={styles.previewMedia}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

function Thumbnail({
  item,
  isSelected,
  onPress,
}: {
  item: MediaData;
  isSelected: boolean;
  onPress: () => void;
}) {
  const thumbnailUri =
    item.type === "video" && item.thumbnail ? item.thumbnail : item.uri;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.thumbnail, isSelected && styles.thumbnailSelected]}
    >
      {item.type === "photo" ? (
        <Image
          source={{ uri: item.uri }}
          style={styles.thumbnailImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.thumbnailVideo}>
          <Image
            source={{ uri: thumbnailUri }}
            style={styles.thumbnailImage}
            resizeMode="cover"
          />
          <View style={styles.videoIndicator}>
            <View style={styles.playIcon} />
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

function CustomImage({ media }: { media: MediaData }) {

  return (
    <>
      {media.resizeMode === "contain" && <Image src={media.uri}
        style={styles.previewMedia}
        resizeMode="contain" />}
      {media.resizeMode === "cover" && <Image src={media.uri}
        style={styles.previewMedia}
        resizeMode="cover" />}
    </>
  )
}

export default function PreviewScreen({
  mediaItems,
  onRetake,
  onSave,
}: PreviewScreenProps) {
  const { setShowMediaPreviews, setCurrentMediaIndex, currentMediaIndex } = useMediaStore()
  const currentMedia = mediaItems[currentMediaIndex];

  const handleSave = useCallback(() => {
    onSave(currentMediaIndex);
  }, [onSave, currentMediaIndex]);

  const renderThumbnail = useCallback(
    ({ item, index }: { item: MediaData; index: number }) => (
      <Thumbnail
        item={item}
        isSelected={index === currentMediaIndex}
        onPress={() => {
          setCurrentMediaIndex(index)
        }}
      />
    ),
    [currentMediaIndex],
  );

  if (!currentMedia) {
    return null;
  }

  return (
    <SafeAreaView style={styles.previewContainer}>
      <TouchableOpacity onPress={() => setShowMediaPreviews(false)} style={[styles.backButton, {
        backgroundColor: "rgba(0, 0, 0, .3)",
        borderRadius: 15
      }]}>
        <Image source={require("../../assets/images/icons/camera_sel_light.png")} style={{ width: 30, height: 30 }} />
      </TouchableOpacity>
      <View style={styles.previewMediaWrapper}>
        {currentMedia.type === "photo" ? (
          <CustomImage media={currentMedia} />
        ) : (
          <VideoPreview uri={currentMedia.uri} isActive={true} />
        )}
      </View>

      {mediaItems.length > 1 && (
        <View style={styles.thumbnailContainer}>
          <FlatList
            data={mediaItems}
            renderItem={renderThumbnail}
            keyExtractor={(_, index) => index.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbnailList}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    position: "absolute",
    top: 75,
    left: 15,
    zIndex: 100,
    padding: 8
  },
  previewContainer: {
    flex: 1,
    backgroundColor: "black",
    borderColor: "green",
    borderWidth: 0,
  },
  previewMediaWrapper: {
    flex: 1,
    width: "100%",
    overflow: "hidden",
    borderColor: "orange",
    borderWidth: 0,
  },
  previewMedia: {
    width: "100%",
    height: "100%",
  },
  thumbnailContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 10,
  },
  thumbnailList: {
    paddingHorizontal: 20,
    gap: THUMBNAIL_SPACING,
  },
  thumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  thumbnailSelected: {
    borderColor: "white",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
    borderRadius: 6
  },
  thumbnailVideo: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  videoIndicator: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  playIcon: {
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: "white",
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
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
});
