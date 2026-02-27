import { MediaData } from "@/constants/media";
import { useMediaStore } from "@/utils/mediaStore";
import { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useShallow } from "zustand/shallow";
import { useBottomSheet } from "../bottomsheet/BottomSheetContext";
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
      <CustomImageButton customStyle={style.buttons} size={25} src={require("../../assets/images/icons/download_sel_light.png")} type="text" />
    )
  } else {
    return (
      <CustomLabel labelText="" />
    )
  }
}

export default function PreviewControls({ media, spawnTextOverlay }: props) {
  const { top } = useSafeAreaInsets()
  const { deleteCurrentMedia, spawnSticker, } = useMediaStore(useShallow(s => ({
    deleteCurrentMedia: s.discardMediaPreview,
    spawnSticker: s.addStickerOverlayToCurrentMedia
  })))
  const {closeSheet, openSheet} = useBottomSheet()

  const handleShowSticker = useCallback(() => {
    openSheet({
      dynamicHeight: false,
      content: (
        <EmojiPicker onSelect={s => {
          spawnSticker(s, 0, 0)
          closeSheet()
        }} />
      ),
      snapPoints: ["80%"],
      isScrollableContent: true, 
    })
  }, [spawnSticker])

  return (
    <View style={[style.container, {
      top: top + 10
    }]} pointerEvents="box-none">
      <DownloadButton media={media} />
      <View>
        <CustomImageButton customStyle={style.buttons} size={27} src={require("../../assets/images/icons/deletepreview_unsel_light.png")} type="text" handleClick={deleteCurrentMedia} />
        <Spacer />
        {(media.type === "photo" || media.type === "video") &&
          <>
            <CustomImageButton customStyle={style.buttons} size={25} src={require("../../assets/images/icons/textoverlay_sel_light.png")} type="text" handleClick={spawnTextOverlay} />
            <Spacer size="small" />
            <CustomImageButton customStyle={style.buttons} size={25} src={require("../../assets/images/icons/stickeroverlay_unsel_light.png")} type="text" handleClick={handleShowSticker} />
            <Spacer size="small" />
            {media.type === "photo" &&
              <>
                <CustomImageButton customStyle={style.buttons} size={27} src={require("../../assets/images/icons/croppreview_unsel_light.png")} type="text" />
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
    shadowOpacity: .75,
    shadowRadius: 10,
  }
})