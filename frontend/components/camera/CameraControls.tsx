import { useMediaStore } from "@/utils/mediaStore";
import { StyleSheet, View } from "react-native";
import CustomImageButton from "../buttons/CustomImageButton";

type ctrlProps = {
  useFlash: "on" | "off"
  setUseFlash: (s: "on" | "off") => void
  flipCamera: () => void
}

const icons = {
  flash: require("../../assets/images/icons/flash_sel_light.png"),
  noFlash: require("../../assets/images/icons/noflash_sel_light.png")
}

export default function CameraControls({ useFlash, setUseFlash, flipCamera }: ctrlProps) {
  function toggleFlash() {
    setUseFlash(useFlash === "on" ? "off" : "on")
  }

  const { isRecording } = useMediaStore()

  return (
    <View style={styles.cameraControls}>
      <CustomImageButton src={require("../../assets/images/icons/flipcamera_sel_light.png")} size={30} type="text" customStyle={styles.imageButtons} handleClick={flipCamera} />
      {!isRecording && <CustomImageButton src={useFlash === "off" ? icons.noFlash : icons.flash} size={30} type="text" customStyle={styles.imageButtons} handleClick={toggleFlash} />}
    </View>
  )
}

const styles = StyleSheet.create({
  cameraControls: {
    position: "absolute",
    left: 0,
    zIndex: 100,
  },
  imageButtons: {
    margin: 5,
    paddingVertical: 12,
    paddingHorizontal: 15,
  }
})