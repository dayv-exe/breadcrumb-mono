import { Colors } from "@/constants/Colors";
import { useMediaStore } from "@/utils/mediaStore";
import { useRouter } from "expo-router";
import { SwitchCameraIcon, ZapIcon, ZapOffIcon } from "lucide-react-native";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useShallow } from "zustand/shallow";
import { useBottomSheet } from "../bottomsheet/BottomSheetContext";
import CustomButton from "../buttons/CustomButton";
import CustomFloatingSquare from "../buttons/CustomFloatingSquare";
import PreviewAndShare from "../crumbs/PreviewAndShare";
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
  const nav = useRouter()
  const darkBgCol = Colors.dark.background
  const { openSheet, closeSheet } = useBottomSheet()
  const insetTop = useSafeAreaInsets().top
  const height = useWindowDimensions().height
  const availableHeight = height - insetTop

  function showPreview() {
    openSheet({
      content: (
        <PreviewAndShare closeSheet={closeSheet} />
      ),
      backgroundStyle: {
        backgroundColor: darkBgCol,
      },
      snapPoints: ["100%"],
      fullExpansionOnOpen: true,
      showHandle: false,
    })
  }

  return (
    <View style={[styles.cameraControls, {
      bottom: screenHeight / 10,
    }]}>
      {mediaPreview.length > 0 && <CustomButton
        handleClick={showPreview}
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
        >Preview & Share</Text>
        <Spacer size="small" />
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