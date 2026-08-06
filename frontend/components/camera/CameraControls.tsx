import { useMediaStore } from "@/utils/mediaStore";
import { ChevronRightIcon, SwitchCameraIcon, ZapIcon, ZapOffIcon } from "lucide-react-native";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SharedValue } from "react-native-reanimated";
import { useShallow } from "zustand/shallow";
import CustomButton from "../buttons/CustomButton";
import CustomFloatingSquare from "../buttons/CustomFloatingSquare";
import Spacer from "../Spacer";
import PreviewBunch from "./PreviewBunch";
import ShutterButton from "./ShutterButton";

type ctrlProps = {
  useFlash: "on" | "off"
  setUseFlash: (s: "on" | "off") => void
  flipCamera: () => void
  recordingProgress: SharedValue<number>
  takePhoto: () => void
  startRecording: () => void
  stopRecording: () => void
}

const icons = {
  flash: require("../../assets/images/icons/flash_sel_light.png"),
  noFlash: require("../../assets/images/icons/noflash_sel_light.png"),
  friends: require("../../assets/images/icons/searchfriends_sel_light.png"),
  gallery: require("../../assets/images/icons/gallery_unsel_light.png"),
  text: require("../../assets/images/icons/crumbtext_sel_light.png"),
}

export default function CameraControls({ useFlash, setUseFlash, flipCamera, recordingProgress, stopRecording, startRecording, takePhoto }: ctrlProps) {
  function toggleFlash() {
    setUseFlash(useFlash === "on" ? "off" : "on")
  }

  const { isRecording, multiCrumbEnabled, mediaPreview, setShowMediaPreviews } = useMediaStore(useShallow(s => ({
    isRecording: s.isRecording,
    multiCrumbEnabled: s.multiCrumbEnabled,
    mediaPreview: s.mediaPreview,
    setShowMediaPreviews: s.setShowMediaPreviews,
  })))
  const size = 25
  const previewSize = 20
  const screenHeight = useWindowDimensions().height

  return (
    <View style={[styles.cameraControls, {
      bottom: screenHeight / 10,
    }]}>
      {mediaPreview.length > 0 && <CustomButton
        handleClick={() => setShowMediaPreviews(true)}
        freed
        type="less-prominent"
        customStyle={{
          opacity: isRecording ? 0 : 1,
          position: "absolute",
          top: -60,
          paddingVertical: 13,
          paddingHorizontal: 5,
        }}
      >
        <PreviewBunch size={previewSize}
          style={{
            marginBottom: 0,
            marginRight: previewSize + 2,
            marginLeft: previewSize
          }}
        />
        <Text
          style={{ color: "#FFF", fontWeight: "bold" }}
        >Edit & Share</Text>
        <ChevronRightIcon stroke="#FFF" strokeWidth={2} size={21} />
      </CustomButton>}
      <CustomFloatingSquare hardShadow customStyle={[styles.imageButtons, {
        opacity: isRecording ? 0 : 1
      }]} handleClick={toggleFlash}>
        {useFlash === "on" && <ZapIcon size={size} stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />}
        {useFlash === "off" && <ZapOffIcon size={size} stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />}
      </CustomFloatingSquare>
      <Spacer />

      <ShutterButton
        recordingProgress={recordingProgress}
        startRecording={startRecording}
        stopRecording={stopRecording}
        takePhoto={takePhoto}
        multiCrumbEnabled={multiCrumbEnabled}
      />

      <Spacer />
      <CustomFloatingSquare hardShadow customStyle={styles.imageButtons} onTouch={flipCamera}>
        <SwitchCameraIcon size={size} stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      </CustomFloatingSquare>
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