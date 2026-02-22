import { showSettingsAlert } from "@/utils/helpers";
import { AudioModule } from "expo-audio";
import * as ImagePicker from "expo-image-picker";
import { useCameraPermission, useMicrophonePermission } from "react-native-vision-camera";

export function useMediaPermissions() {
  const { hasPermission: hasCameraPermissions, requestPermission: reqCamPermission } = useCameraPermission()
  const { hasPermission: hasMicPermissions, requestPermission: reqMicPermission } = useMicrophonePermission()

  async function requestImagePickerGallery() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        showSettingsAlert("Gallery");
        return false;
      }
      return true;
    } catch (error) {
      console.error("Permission error:", error);
      return false;
    }
  }

  async function requestImagePickerCamera() {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        showSettingsAlert("Camera");
        return false;
      }
      return true;
    } catch (error) {
      console.error("Permission error:", error);
      return false;
    }
  }

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

  async function requestRecordingPermission() {
    try {
      const status = await AudioModule.requestRecordingPermissionsAsync();

      if (!status.granted) {
        showSettingsAlert("Microphone");
        return false;
      }
      return true;
    } catch (error) {
      console.error("Permission error:", error);
      return false;
    }
  }

  return {
    requestMediaPermissions,
    hasCameraPermissions,
    hasMicPermissions,
    requestImagePickerCamera,
    requestImagePickerGallery,
    requestRecordingPermission,
  }
}