import { useCameraState } from "@/context/CameraContext";
import { StyleSheet, View } from "react-native";
import CustomImageButton from "../buttons/CustomImageButton";
import Spacer from "../Spacer";

export default function CameraControls() {
  const { flipCamera } = useCameraState()

  return (
    <View style={styles.cameraControls}>
      <CustomImageButton type="text" src={require("../../../assets/images/icons/noflash_sel_light.png")} size={30} fitToContent />
      <Spacer />
      <CustomImageButton handleClick={flipCamera} type="text" src={require("../../../assets/images/icons/flipcamera_sel_light.png")} size={30} fitToContent />
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
  },
})