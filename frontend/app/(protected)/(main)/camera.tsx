import CustomButton from "@/components/buttons/CustomButton";
import CameraView from "@/components/camera/CameraView";
import CustomLabel from "@/components/CustomLabel";
import Spacer from "@/components/Spacer";
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
  const { isRecording } = useMediaStore(useShallow(s => ({
    isRecording: s.isRecording,
  })))
  const insets = useSafeAreaInsets()
  const nav = useRouter()

  const resolveAddress = () => {
    const curCoords = useLocationStore.getState().coordinates
    setReverseGeocodeCoordinates(curCoords)
  }

  useEffect(() => {
    resolveAddress()
  }, [])


  function handleGoBack() {
    nav.dismiss()
  }

  return (
    <View
      style={[styles.container, {
        paddingTop: insets.top + 15
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
          <CustomLabel
            textAlign="center"
            bold
            width="auto"
            labelText={address?.split(",")[0] ?? "Current Address"}
            padding={0}
            fontSize={16}
          />
          <Spacer size="tiny" />
          <CustomLabel
            textAlign="center"
            fade
            width="auto"
            labelText="New"
            padding={0}
            fontSize={14}
          />
        </View>
      </View>
      <CameraView />
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
    alignItems: "flex-start",
  },
  title: {

  },
  backButton: {
    position: "absolute",
    left: 15,
  }
})