import { MAX_PREVIEW_MEDIA } from "@/constants/appConstants";
import { useImagePicker } from "@/hooks/useImagePicker";
import { useMediaStore } from "@/utils/mediaStore";
import { StyleSheet, View } from "react-native";
import { useShallow } from "zustand/shallow";
import CustomImageButton from "../buttons/CustomImageButton";

type ctrlProps = {
  useFlash: "on" | "off"
  setUseFlash: (s: "on" | "off") => void
  flipCamera: () => void
}

const icons = {
  flash: require("../../assets/images/icons/flash_sel_light.png"),
  noFlash: require("../../assets/images/icons/noflash_sel_light.png"),
  friends: require("../../assets/images/icons/searchfriends_sel_light.png"),
  gallery: require("../../assets/images/icons/gallery_unsel_light.png"),
}

export default function CameraControls({ useFlash, setUseFlash, flipCamera }: ctrlProps) {
  function toggleFlash() {
    setUseFlash(useFlash === "on" ? "off" : "on")
  }

  const { isRecording, previews } = useMediaStore(useShallow(s => ({
    isRecording: s.isRecording,
    previews: s.mediaPreview
  })))
  const { pickFromGallery, isLoading } = useImagePicker()

  return (
    <View style={[styles.cameraControls, {
      justifyContent: isRecording ? "flex-end" : "space-between"
    }]}>
      {!isRecording && <CustomImageButton
        handleClick={() => {
          pickFromGallery({
            allowsEditing: false,
            mediaTypes: ["images", "videos"],
            allowMultipleSel: true,
            selectionLimit: MAX_PREVIEW_MEDIA - previews.length
          });
        }}
        customStyle={styles.imageButtons}
        type="text"
        src={icons.gallery}
        size={27}
      />}
      {!isRecording && <CustomImageButton src={useFlash === "off" ? icons.noFlash : icons.flash} size={25} type="text" customStyle={styles.imageButtons} handleClick={toggleFlash} />}
      <CustomImageButton src={require("../../assets/images/icons/flipcamera_sel_light.png")} size={25} type="text" customStyle={styles.imageButtons} handleClick={flipCamera} />
    </View>
  )
}

const styles = StyleSheet.create({
  cameraControls: {
    position: "absolute",
    width: "100%",
    top: 10,
    zIndex: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10
  },
  imageButtons: {

  }
})