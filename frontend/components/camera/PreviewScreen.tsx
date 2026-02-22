import { MediaData } from "@/constants/media";
import { useDropZone } from "@/hooks/useDropZone";
import { useGesture } from "@/hooks/useGestures";
import { useMediaStore } from "@/utils/mediaStore";
import { useVideoPlayer, VideoView } from "expo-video";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useShallow } from "zustand/shallow";
import CustomImageButton from "../buttons/CustomImageButton";
import DeleteZone from "../editor/DeleteZone";
import DraggableTextOverlay from "../editor/DraggableTextOverlay";

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
      {media.resizeMode === "contain" && (
        <Image
          key={media.uri}
          src={media.uri}
          style={styles.previewMedia}
          resizeMode="contain"
        />
      )}
      {media.resizeMode === "cover" && (
        <Image
          key={media.uri}
          src={media.uri}
          style={styles.previewMedia}
          resizeMode="cover"
        />
      )}
    </>
  );
}

export default function PreviewScreen({
  mediaItems,
  onRetake,
  onSave,
}: PreviewScreenProps) {
  const {
    editing,
    setShowMediaPreviews,
    setCurrentMediaIndex,
    currentMediaIndex,
    addTextOverlayToCurrentMedia,
    removeTextOverlayFromCurrentMedia,
  } = useMediaStore(
    useShallow(s => ({
      editing: s.editing,
      setShowMediaPreviews: s.setShowMediaPreviews,
      setCurrentMediaIndex: s.setCurrentMediaIndex,
      currentMediaIndex: s.currentMediaIndex,
      addTextOverlayToCurrentMedia: s.addTextOverlayToCurrentMedia,
      removeTextOverlayFromCurrentMedia: s.removeTextOverlayFromCurrentMedia
    }))
  );
  const currentMedia = mediaItems[currentMediaIndex];
  const currentOverlayDragId = useRef<string | null>(null)
  const insets = useSafeAreaInsets();
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const focusIndex = useRef(-1)
  const deleteZone = useDropZone({
    hitSlop: 20,
    onDrop: () => removeTextOverlayFromCurrentMedia(currentOverlayDragId.current ?? ""),
  });

  const { gesture } = useGesture({
    onTap: ({ x, y }) => {
      if (editing) return;
      focusIndex.current = currentMedia.overlays?.length ?? 0
      const centerRelativeX = x - containerSize.width / 2;
      const centerRelativeY = y - containerSize.height / 2;
      addTextOverlayToCurrentMedia("", centerRelativeX, centerRelativeY)
    },
  });

  const renderThumbnail = useCallback(
    ({ item, index }: { item: MediaData; index: number }) => (
      <Thumbnail
        item={item}
        isSelected={index === currentMediaIndex}
        onPress={() => {
          setCurrentMediaIndex(index);
        }}
      />
    ),
    [currentMediaIndex]
  );

  if (!currentMedia) {
    return null;
  }

  return (
    <View style={styles.previewContainer}>

      <CustomImageButton
        type="text"
        customStyle={styles.backButton}
        handleClick={() => setShowMediaPreviews(false)}
        src={require("../../assets/images/icons/camera_sel_light.png")}
        size={35}
      />

      <GestureDetector gesture={gesture}>
        <View
          style={[styles.previewMediaWrapper, { marginTop: insets.top }]}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setContainerSize({ width, height });
          }}
        >
          {currentMedia.type === "photo" ? (
            <CustomImage media={currentMedia} />
          ) : (
            <VideoPreview uri={currentMedia.uri} isActive={true} />
          )}
        </View>
      </GestureDetector>

      {/* Text overlays */}
      {currentMedia.overlays && (
        <View
          style={[StyleSheet.absoluteFill, { zIndex: 1000 }]}
          pointerEvents="box-none"
        >
          {currentMedia.overlays.map((overlay, index) => {
            if (overlay.type === "text") {
              return (
                <DraggableTextOverlay handleRemoveOverlay={() => removeTextOverlayFromCurrentMedia(overlay.id)} focusOnMount={focusIndex.current === index} overlay={overlay} key={overlay.id} onBlur={() => {
                  focusIndex.current = -1
                }} onDragEnd={(x, y) => {
                  deleteZone.handleDragEnd(x, y)
                  // currentOverlayDragId.current = null
                }} onDragMove={deleteZone.handleDragMove} onDragStart={() => {
                  deleteZone.handleDragStart()
                  currentOverlayDragId.current = overlay.id
                }} />
              );
            }

            if (focusIndex.current === index) {
              focusIndex.current = -1
            }
            return null;
          })}
        </View>
      )}

      <DeleteZone
        visible={deleteZone.isVisible}
        active={deleteZone.isActive}
        onLayout={deleteZone.onLayout}
      />

      {/* Thumbnail strip */}
      {mediaItems.length > 1 && (
        <View style={styles.previewControls}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    position: "absolute",
    top: 75,
    left: 15,
    zIndex: 100,
    padding: 8,
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
    borderRadius: 6,
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
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  textInputOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
  },
  textInput: {
    color: "white",
    width: "100%",
    textAlign: "center",
    borderRadius: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
});