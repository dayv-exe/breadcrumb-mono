import { MAX_PREVIEW_MEDIA } from "@/constants/appConstants";
import { useImagePicker } from "@/hooks/useImagePicker";
import { useMediaStore } from "@/utils/mediaStore";
import { ImagePlusIcon, LockIcon, SwitchCameraIcon, ZapIcon, ZapOffIcon } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useShallow } from "zustand/shallow";
import CustomFloatingSquare from "../buttons/CustomFloatingSquare";

type ctrlProps = {
  useFlash: "on" | "off"
  setUseFlash: (s: "on" | "off") => void
  flipCamera: () => void
  showTextEditor: () => void
}

const icons = {
  flash: require("../../assets/images/icons/flash_sel_light.png"),
  noFlash: require("../../assets/images/icons/noflash_sel_light.png"),
  friends: require("../../assets/images/icons/searchfriends_sel_light.png"),
  gallery: require("../../assets/images/icons/gallery_unsel_light.png"),
  text: require("../../assets/images/icons/crumbtext_sel_light.png"),
}

export default function CameraControls({ useFlash, setUseFlash, flipCamera, showTextEditor }: ctrlProps) {
  function toggleFlash() {
    setUseFlash(useFlash === "on" ? "off" : "on")
  }

  const insets = useSafeAreaInsets()

  const { isRecording, previews } = useMediaStore(useShallow(s => ({
    isRecording: s.isRecording,
    previews: s.mediaPreview
  })))
  const { pickFromGallery, isLoading } = useImagePicker()
  const size = 25

  return (
    <View style={[styles.cameraControls, {
      alignItems: 'flex-start'
    }]}>
      <CustomFloatingSquare hardShadow customStyle={[styles.imageButtons, {
        opacity: isRecording ? 0 : 1
      }]}>
        <LockIcon size={size} stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      </CustomFloatingSquare>
      <View>
        <CustomFloatingSquare hardShadow customStyle={styles.imageButtons} onTouch={flipCamera}>
          <SwitchCameraIcon size={size} stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        </CustomFloatingSquare>
        <CustomFloatingSquare hardShadow customStyle={[styles.imageButtons, {
          opacity: isRecording ? 0 : 1
        }]} handleClick={toggleFlash}>
          {useFlash === "on" && <ZapIcon size={size} stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />}
          {useFlash === "off" && <ZapOffIcon size={size} stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />}
        </CustomFloatingSquare>
        <CustomFloatingSquare hardShadow handleClick={() => {
          pickFromGallery({
            allowsEditing: false,
            mediaTypes: ["images", "videos"],
            allowMultipleSel: true,
            selectionLimit: MAX_PREVIEW_MEDIA - previews.length
          });
        }}
          customStyle={[styles.imageButtons, {
            opacity: isRecording ? 0 : 1
          }]}>
          <ImagePlusIcon size={size} stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        </CustomFloatingSquare>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  cameraControls: {
    position: "absolute",
    top: 0,
    right: 0,
    zIndex: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  imageButtons: {
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    margin: 5
  }
})