import { MediaData } from "@/constants/media";
import { useMediaStore } from "@/utils/mediaStore";
import { CropIcon, DownloadIcon, Trash2Icon, TypeIcon } from "lucide-react-native";
import { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useShallow } from "zustand/shallow";
import { useBottomSheet } from "../bottomsheet/BottomSheetContext";
import CustomFloatingSquare from "../buttons/CustomFloatingSquare";
import CustomImageButton from "../buttons/CustomImageButton";
import CustomLabel from "../CustomLabel";
import EmojiPicker from "../inputs/EmojiPicker";
import Spacer from "../Spacer";

type props = {
  media: MediaData
  spawnTextOverlay: () => void
}

function DownloadButton({ media }: { media: MediaData }) {
  if (media.type === "photo" || media.type === "video") {
    return (
      <CustomFloatingSquare hardShadow type="text">
        <DownloadIcon size={27} stroke={"#fff"} strokeWidth={3} />
      </CustomFloatingSquare>
    )
  } else {
    return (
      <CustomLabel labelText="" />
    )
  }
}

export default function PreviewControls({ media, spawnTextOverlay }: props) {
  const { top } = useSafeAreaInsets()
  const { deleteCurrentMedia, spawnSticker, setEditing } = useMediaStore(useShallow(s => ({
    deleteCurrentMedia: s.discardMediaPreview,
    spawnSticker: s.addStickerOverlayToCurrentMedia,
    setEditing: s.setEditing
  })))
  const { closeSheet, openSheet } = useBottomSheet()

  const handleDelCurMedia = () => {
    if (media.isPlaceholder) return
    deleteCurrentMedia()
  }

  const handleSpawnText = () => {
    if (media.isPlaceholder) return
    spawnTextOverlay()
  }

  const handleShowSticker = useCallback(() => {
    if (media.isPlaceholder) return
    setEditing("sticker")
    openSheet({
      dynamicHeight: false,
      content: (
        <EmojiPicker onSelect={s => {
          spawnSticker(s, 0, 0)
          closeSheet()
          setEditing("none")
        }} />
      ),
      snapPoints: ["80%"],
      isScrollableContent: true,
    })
  }, [spawnSticker])

  const handleCrop = () => {
    if (media.isPlaceholder) return
    media.pendingCropTransform = media.cropTransform
    setEditing("crop")
  }

  return (
    <View style={[style.container, {
      top: top + 10
    }]} pointerEvents="box-none">
      <DownloadButton media={media} />
      <View>
        <CustomFloatingSquare hardShadow type="text" handleClick={deleteCurrentMedia}>
          <Trash2Icon size={27} stroke={"#fff"} strokeWidth={3} />
        </CustomFloatingSquare>
        <Spacer />
        {(media.type === "photo" || media.type === "video") &&
          <>
            <CustomFloatingSquare hardShadow type="text" handleClick={handleSpawnText}>
              <TypeIcon size={25} stroke={"#fff"} strokeWidth={3} />
            </CustomFloatingSquare>
            <Spacer size="small" />
            <CustomImageButton customStyle={style.buttons} size={23} src={require("../../assets/images/icons/stickeroverlay_unsel_light.png")} type="text" handleClick={handleShowSticker} />
            <Spacer size="small" />
            {media.type === "photo" &&
              <>
                <CustomFloatingSquare hardShadow type="text" handleClick={handleCrop}>
                  <CropIcon size={25} stroke={"#fff"} strokeWidth={3} />
                </CustomFloatingSquare>
              </>
            }
          </>}
      </View>
    </View>
  )
}

const style = StyleSheet.create({
  container: {
    width: "100%",
    position: "absolute",
    zIndex: 10000,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 3
  },
  buttons: {
    elevation: 7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
  }
})