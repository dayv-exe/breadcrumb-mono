import { useCameraState } from "@/context/CameraContext";
import { useMemo, useRef } from "react";
import { StyleSheet } from "react-native";
import Reanimated, { useAnimatedProps, useSharedValue } from "react-native-reanimated";
import { Camera, CameraDevice, CameraProps } from "react-native-vision-camera";
import RecordingIndicator from "../recordingIndicator";
import NoCameraFound from "./NoCameraFound";
import NoCameraPermission from "./NoCameraPermission";

const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera)

type cameraComponentType = {
  activeCamera: CameraDevice
}
function CameraComponent({ activeCamera }: cameraComponentType) {
  const cameraRef = useRef<Camera>(null)
  const zoom = useSharedValue(activeCamera.neutralZoom)
  const format = useMemo(() => {
    return activeCamera.formats.find(
      f => f.videoWidth === 1920 && f.videoHeight === 1080 && f.maxFps >= 28
    )
  }, [activeCamera])

  const animatedProps = useAnimatedProps<CameraProps>(
    () => ({ zoom: zoom.value }),
    [zoom]
  )

  return (
    <ReanimatedCamera
      ref={cameraRef}
      enableZoomGesture
      style={[StyleSheet.absoluteFill, { backgroundColor: "black", borderRadius: 25, overflow: "hidden" }]}
      device={activeCamera}
      isActive={true}
      animatedProps={animatedProps}
      audio={true}
      photo={true}
      video={true}
      format={format}
      photoQualityBalance="speed"
    />
  )
}

export default function CameraView() {
  const { hasCameraPermissions,
    hasMicPermissions,
    requestMediaPermissions,
    activeCamera,
    isRecording,
  } = useCameraState()

  if (!hasCameraPermissions || !hasMicPermissions) {
    let missingPermissions = []

    if (!hasCameraPermissions) missingPermissions.push("camera")
    if (!hasMicPermissions) missingPermissions.push("microphone")

    return (
      <NoCameraPermission missingPermissions={missingPermissions} requestPerms={requestMediaPermissions} />
    )
  }

  if (!activeCamera) return (
    <NoCameraFound />
  )

  return (
    <>
      {isRecording && <RecordingIndicator customStyle={{
        zIndex: 100
      }} />}
      <CameraComponent activeCamera={activeCamera} />
    </>
  )
}