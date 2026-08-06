import CustomButton from "@/components/buttons/CustomButton";
import CameraView from "@/components/camera/CameraView";
import PreviewScreen from "@/components/camera/PreviewScreen";
import CustomLabel from "@/components/CustomLabel";
import { useReverseGeocode } from "@/hooks/useReverseGeocode";
import { useMediaStore } from "@/utils/mediaStore";
import { useLocationStore } from "@/utils/useLocationStore";
import { useRouter } from "expo-router";
import { ChevronLeftIcon } from "lucide-react-native";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useShallow } from "zustand/shallow";

export default function CameraPage() {
  const { address, setReverseGeocodeCoordinates } = useReverseGeocode()
  const { isRecording, showMediaPreview } = useMediaStore(useShallow(s => ({
    isRecording: s.isRecording,
    showMediaPreview: s.showMediaPreviews,
  })))
  const insets = useSafeAreaInsets()
  const nav = useRouter()

  useEffect(() => {
    const coord = useLocationStore.getState().coordinates
    setReverseGeocodeCoordinates(coord)
  }, [])

  function handleGoBack() {
    nav.dismiss()
  }

  return (
    <View
      style={[styles.container, {
        paddingTop: insets.top
      }]}
    >
      <View
        style={[styles.header, {
          top: insets.top,
          opacity: isRecording ? 0 : 1,
        }]}
      >
        <CustomButton
          freed
          customStyle={[
            styles.backButton
          ]}
          type="text"
          handleClick={handleGoBack}
        >
          <ChevronLeftIcon stroke={"white"} strokeWidth={3.5} size={25} />
        </CustomButton>
        <View
          style={[

          ]}
        >
          <CustomLabel textAlign="center" bold width="auto" labelText="New" padding={0} fontSize={21} />
          <CustomLabel textAlign="center" allowTruncate fade width="auto" labelText={address?.split(",")[0] ?? "Current location"} padding={0} fontSize={13} />
        </View>
      </View>
      {!showMediaPreview && <CameraView />}
      {showMediaPreview && <PreviewScreen />}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    position: "absolute",
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {

  },
  backButton: {
    position: "absolute",
    left: 15,
  }
})