import CustomImageButton from "@/components/buttons/CustomImageButton";
import CameraControls from "@/components/camera/CameraControls";
import CameraView from "@/components/camera/CameraView";
import PreviewScreen from "@/components/camera/PreviewScreen";
import ShutterButton from "@/components/camera/ShutterButton";
import { useCamera } from "@/hooks/useCamera";
import { useImagePicker } from "@/hooks/useImagePicker";
import { useMediaStore } from "@/utils/mediaStore";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TopButtons = () => {
  const { pickFromGallery, image } = useImagePicker();
  const router = useRouter();

  return (
    <View style={[styles.topControls, {}]}>
      <CustomImageButton
        fitToContent
        type="text"
        src={require("../../../assets/images/icons/searchfriends_sel_light.png")}
        size={24.5}
        handleClick={() => router.push("/find-friends")}
      />
      <CustomImageButton
        handleClick={() => {
          pickFromGallery({
            allowsEditing: false,
            mediaTypes: ["images", "videos"],
          });
        }}
        type="text"
        src={require("../../../assets/images/icons/gallery_unsel_light.png")}
        size={30}
      />
    </View>
  );
};

function handleRetake() { }

function handleSave() { }

export default function AddScreen() {
  const {
    activeCamera,
    recordingProgress,
    startRecording,
    stopRecording,
    takePhoto,
    cameraRef,
    zoomLevel,
    setUseFlash,
    useFlash,
    flipCamera,
  } = useCamera();
  const { isRecording, mediaPreview, showMediaPreviews } = useMediaStore();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();

  return (
    <>
      {(!showMediaPreviews && mediaPreview.length < 15) && (
        <View
          style={{ flex: 1, backgroundColor: "black", paddingTop: insets.top }}
        >
          {isFocused && (
            <View style={styles.container}>
              <CameraView
                activeCamera={activeCamera}
                cameraRef={cameraRef}
                isRecording={isRecording}
                zoomLevel={zoomLevel}
                stopRecording={stopRecording}
              >
                <ShutterButton
                  recordingProgress={recordingProgress}
                  startRecording={startRecording}
                  stopRecording={stopRecording}
                  takePhoto={takePhoto}
                />
              </CameraView>
              {activeCamera && (
                <>
                  {!isRecording && <TopButtons />}
                  <CameraControls
                    flipCamera={flipCamera}
                    setUseFlash={setUseFlash}
                    useFlash={useFlash}
                  />
                </>
              )}
            </View>
          )}
        </View>
      )}
      {(showMediaPreviews || mediaPreview.length > 14) && (
        <PreviewScreen
          mediaItems={mediaPreview}
          onRetake={handleRetake}
          onSave={handleRetake}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
  },
  topControls: {
    position: "absolute",
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    top: 15,
    paddingHorizontal: 20,
    paddingRight: 15,
  },
});
