import { MAX_VIDEO_DURATION_MILLISECONDS } from "@/constants/appConstants";
import { useMediaStore } from "@/utils/mediaStore";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  cancelAnimation,
  Easing,
  SharedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  Camera,
  CameraDevice,
  CameraDeviceFormat,
  useCameraDevice,
  VideoFile,
} from "react-native-vision-camera";
import { scheduleOnRN } from "react-native-worklets";

type useCameraReturnType = {
  flipCamera: () => void;
  takePhoto: () => void;
  setUseFlash: (s: "on" | "off") => void;
  startRecording: () => void;
  stopRecording: () => void;

  recordingProgress: SharedValue<number>;
  zoomLevel: SharedValue<number>;
  format: CameraDeviceFormat | undefined;

  activeCamera: CameraDevice | null;
  cameraRef: React.RefObject<Camera | null>;
  useFlash: "on" | "off";
};

export function useCamera(): useCameraReturnType {
  const { addMediaPreview, setIsRecording } = useMediaStore();

  const backCamera = useCameraDevice("back");
  const frontCamera = useCameraDevice("front");

  const selectedCameraIndex = useRef(0);
  const [activeCamera, setActiveCamera] = useState<CameraDevice | null>(null);

  const availableCameras = useMemo<CameraDevice[]>(() => {
    const cams: CameraDevice[] = [];
    if (backCamera) cams.push(backCamera);
    if (frontCamera) cams.push(frontCamera);
    return cams;
  }, [frontCamera, backCamera]);

  const recordingProgress = useSharedValue(0);
  const zoomLevel = useSharedValue(activeCamera?.neutralZoom ?? 1);
  const format = useMemo(() => {
    return activeCamera?.formats.find(
      (f) => f.videoWidth === 1920 && f.videoHeight === 1080 && f.maxFps >= 28,
    );
  }, [activeCamera]);

  useEffect(() => {
    if (availableCameras.length > 0) {
      selectedCameraIndex.current = 0;
      setActiveCamera(availableCameras[0]);
    }
  }, [availableCameras]);

  function flipCamera() {
    if (availableCameras.length < 2) return;

    selectedCameraIndex.current = selectedCameraIndex.current === 0 ? 1 : 0;

    setActiveCamera(availableCameras[selectedCameraIndex.current]);
  }

  async function stopRecording() {
    if (!cameraRef.current) return;
    try {
      setIsRecording(false);
      await cameraRef.current.stopRecording();
      cancelAnimation(recordingProgress);
      recordingProgress.value = 0;
      zoomLevel.value = 1;
    } catch (error) {
      console.error("Error stopping recording:", error);
    }
  }

  async function startRecording() {
    if (cameraRef.current) {
      try {
        setIsRecording(true);
        recordingProgress.value = 0;

        recordingProgress.value = withTiming(
          1,
          {
            duration: MAX_VIDEO_DURATION_MILLISECONDS,
            easing: Easing.linear,
          },
          (finished) => {
            if (finished) {
              scheduleOnRN(stopRecording);
            }
          },
        );

        await cameraRef.current.startRecording({
          flash: useFlash,
          onRecordingFinished: (video: VideoFile) => {
            addMediaPreview({
              type: "video",
              uri: `file://${video.path}`,
            });
          },
          onRecordingError: (error) => {
            console.error("Recording error:", error);
          },
        });
      } catch (error) {
        console.error("Error starting recording:", error);
      }
    }
  }

  const cameraRef = useRef<Camera>(null);

  async function takePhoto() {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePhoto({
          flash: useFlash,
        });
        addMediaPreview({
          type: "photo",
          uri: `file://${photo.path}`,
        });
      } catch (error) {
        console.error("Error taking photo:", error);
      }
    }
  }

  const [useFlash, setUseFlash] = useState<"on" | "off">("off");

  return {
    flipCamera,
    activeCamera,
    cameraRef,
    setUseFlash,
    takePhoto,
    useFlash,
    format,
    recordingProgress,
    zoomLevel,
    startRecording,
    stopRecording,
  };
}
