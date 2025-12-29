import { showSettingsAlert } from "@/utils/helpers"
import { useCameraPermission, useMicrophonePermission } from "react-native-vision-camera"

export function usePermissions() {
  const { hasPermission: hasCameraPermissions, requestPermission: reqCamPermission } = useCameraPermission()
    const { hasPermission: hasMicPermissions, requestPermission: reqMicPermission } = useMicrophonePermission()
  
  async function requestMediaPermissions() {
    if (!hasCameraPermissions) {
      const status = await reqCamPermission()
      if (!status) {
        showSettingsAlert("Camera and Microphone")
      }
    } else if (!hasMicPermissions) {
      const status = await reqMicPermission()
      if (!status) {
        showSettingsAlert("Microphone")
      }
    }
  }

  return {
    requestMediaPermissions,
    hasCameraPermissions,
    hasMicPermissions,
  }
}