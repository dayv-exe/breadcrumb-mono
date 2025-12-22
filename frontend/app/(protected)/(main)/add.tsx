import CustomImageButton from "@/components/buttons/CustomImageButton";
import CameraView from "@/components/camera/CameraView";
import { useCameraState } from "@/context/CameraContext";
import { useImagePicker } from "@/hooks/useImagePicker";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TopButtons = () => {
  const { pickFromGallery } = useImagePicker()
  const router = useRouter()

  return (
    <View style={[styles.topControls, {}]}>
      <CustomImageButton fitToContent type="text" src={require("../../../assets/images/icons/searchfriends_sel_light.png")} size={24.5} handleClick={() => router.push("/find-friends")} />
      <CustomImageButton handleClick={() => {
        pickFromGallery({ allowsEditing: false, mediaTypes: ["images", "videos"] })
      }} type="text" src={require("../../../assets/images/icons/gallery_unsel_light.png")} size={30} />
    </View>
  )
}

export default function AddScreen() {
  const { activeCamera, isRecording } = useCameraState()
  const isFocused = useIsFocused()
  const insets = useSafeAreaInsets()

  return (
    <View style={{ flex: 1, backgroundColor: "black", paddingTop: insets.top }}>
      {isFocused &&
        <View style={styles.container}>
          <CameraView />
          {activeCamera &&
            <>
              {!isRecording && <TopButtons />}
            </>
          }
        </View>
      }
    </View>
  )

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column"
  },
  topControls: {
    position: "absolute",
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    top: 15,
    paddingHorizontal: 20,
    paddingRight: 15
  },
})