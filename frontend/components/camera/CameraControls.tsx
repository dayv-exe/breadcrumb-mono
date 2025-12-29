import { StyleSheet, View } from "react-native";
import CustomImageButton from "../buttons/CustomImageButton";
import Spacer from "../Spacer";

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

  return (
    <View style={styles.cameraControls}>
      <CustomImageButton handleClick={toggleFlash} type="text" src={useFlash === "on" ? icons.flash : icons.noFlash} size={30} fitToContent />
      <Spacer />
      <CustomImageButton handleClick={flipCamera} type="text" src={require("../../assets/images/icons/flipcamera_sel_light.png")} size={30} fitToContent />
      <Spacer size="tiny" />
    </View>
  )
}

const styles = StyleSheet.create({
  cameraControls: {
    position: "absolute",
    right: 5,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 100,
    paddingTop: 13,
    paddingHorizontal: 10,
    paddingBottom: 10,
    opacity: .9,
    zIndex: 100,
  },
})