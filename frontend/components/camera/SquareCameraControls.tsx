import { useImagePicker } from "@/hooks/useImagePicker";
import { useMediaStore } from "@/utils/mediaStore";
import { StyleSheet, View } from "react-native";
import { SharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useShallow } from "zustand/shallow";
import CustomImageButton from "../buttons/CustomImageButton";
import SolidShutterButton from "./SolidShutterButton";

type ctrlProps = {
  useFlash: "on" | "off"
  setUseFlash: (s: "on" | "off") => void
  flipCamera: () => void
  recordingProgress: SharedValue<number>
  startRecording: () => void
  stopRecording: () => void
  takePhoto: () => void
}

const icons = {
  flash: require("../../assets/images/icons/flash_sel_light.png"),
  noFlash: require("../../assets/images/icons/noflash_sel_light.png"),
  friends: require("../../assets/images/icons/searchfriends_sel_light.png"),
  gallery: require("../../assets/images/icons/gallery_unsel_light.png"),
  text: require("../../assets/images/icons/crumbtext_sel_light.png"),
}

export default function SquareCameraControls({ useFlash, setUseFlash, flipCamera, takePhoto, recordingProgress, startRecording, stopRecording }: ctrlProps) {
  function toggleFlash() {
    setUseFlash(useFlash === "on" ? "off" : "on")
  }

  const insets = useSafeAreaInsets()

  const { isRecording, previews } = useMediaStore(useShallow(s => ({
    isRecording: s.isRecording,
    previews: s.mediaPreview
  })))
  const { pickFromGallery, isLoading } = useImagePicker()
  const size = 27

  return (
    <View style={[styles.cameraControls, {
    }]}>
      {/* <CustomImageButton
        handleClick={() => {
          pickFromGallery({
            allowsEditing: false,
            mediaTypes: ["images", "videos"],
            allowMultipleSel: true,
            selectionLimit: MAX_PREVIEW_MEDIA - previews.length
          });
        }}
        customStyle={[styles.imageButtons, {
          opacity: isRecording ? 0 : 1
        }]}
        type="text"
        src={icons.gallery}
        size={size}
      /> */}
      <CustomImageButton
        src={useFlash === "off" ? icons.noFlash : icons.flash}
        size={size}
        type="text"
        customStyle={[styles.imageButtons, {
          opacity: isRecording ? 0 : 1,
        }]}
        handleClick={toggleFlash}
      />
      <SolidShutterButton
        recordingProgress={recordingProgress}
        startRecording={startRecording}
        stopRecording={stopRecording}
        takePhoto={takePhoto}
      />
      <CustomImageButton
        src={require("../../assets/images/icons/flipcamera_sel_light.png")}
        size={size}
        type="text"
        customStyle={styles.imageButtons}
        handleClick={flipCamera}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  cameraControls: {
    position: "absolute",
    zIndex: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    marginTop: 5,
    bottom: 90,
  },
  imageButtons: {
    marginHorizontal: 10,
    elevation: 7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
  }
})