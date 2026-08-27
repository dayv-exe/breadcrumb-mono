import { MAX_PREVIEW_MEDIA, MAX_VIDEO_DURATION_MILLISECONDS } from "@/constants/appConstants";
import { defaultMediaDataUploadState, MediaData } from "@/constants/media";
import { useUploadQueueStore } from "@/hooks/useAutoUploadQueue";
import { useMediaStore } from "@/utils/mediaStore";
import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createVideoThumbnail } from "react-native-compressor";
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
  VideoFile
} from "react-native-vision-camera";
import { scheduleOnRN } from "react-native-worklets";
import { v4 as uuidv4 } from "uuid";
import { useShallow } from "zustand/shallow";

type useCameraReturnType = {
  flipCamera: () => void;
  takePhoto: (shutterSignal: SharedValue<number>) => void;
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

function normalizeFileUri(path: string) {
  return path.startsWith("file://") ? path : `file://${path}`;
}

export function useCamera(): useCameraReturnType {
  const { addMediaPreview, setIsRecording, mediaPreview } = useMediaStore(
    useShallow(s => ({
      addMediaPreview: s.addMediaPreview,
      setIsRecording: s.setIsRecording,
      mediaPreview: s.mediaPreview,
    }))
  );
  const { add, } = useUploadQueueStore()
  const mediaPrevLen = useRef(mediaPreview.length)
  useEffect(() => {
    mediaPrevLen.current = mediaPreview.length
  }, [mediaPreview])

  const backCamera = useCameraDevice("back");
  const frontCamera = useCameraDevice("front");

  const shouldAutoRestart = useRef(false)

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

  async function stopRecording(autoRestart = false) {
    if (!cameraRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)
    try {
      autoRestart = autoRestart && mediaPrevLen.current + 1 < MAX_PREVIEW_MEDIA
      if (!autoRestart) {
        setIsRecording(false);
        zoomLevel.value = activeCamera?.neutralZoom ?? 1;

      }
      await cameraRef.current.stopRecording();
      cancelAnimation(recordingProgress);
      recordingProgress.value = 0;
      shouldAutoRestart.current = autoRestart
    } catch (error) {
      console.error("Error stopping recording:", error);
    }
  }

  async function startRecording() {
    if (cameraRef.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)
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
              scheduleOnRN(stopRecording, true);
            }
          },
        );

        await cameraRef.current.startRecording({
          flash: useFlash,
          fileType: "mp4",
          onRecordingFinished: async (video: VideoFile) => {
            const path = normalizeFileUri(video.path)
            const thumbnail = normalizeFileUri(await (await createVideoThumbnail(path)).path)
            const newMedia: MediaData = {
              id: uuidv4(),
              type: "video",
              localUri: path,
              thumbnailUri: thumbnail,
              resizeMode: "cover",
              uploadState: defaultMediaDataUploadState(),
            }
            addMediaPreview(newMedia);

            add(newMedia)

            if (shouldAutoRestart.current) {
              shouldAutoRestart.current = false
              startRecording()
            } else {
              // setShowMediaPreview(true)
            }
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

  async function takeNormalPhoto(shutterSignal: SharedValue<number>) {
    if (cameraRef.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)
      try {
        const photo = await cameraRef.current.takePhoto({
          flash: useFlash,
          enableShutterSound: false
        });
        shutterSignal.set(shutterSignal.get() + 1)
        const newMedia: MediaData = {
          id: uuidv4(),
          type: "photo",
          localUri: normalizeFileUri(photo.path),
          resizeMode: "cover",
          width: photo.width,
          height: photo.height,
          uploadState: defaultMediaDataUploadState()
        }
        addMediaPreview(newMedia);
        add(newMedia)
      } catch (error) {
        console.error("Error taking photo:", error);
      }
    }
  }

  async function takePhoto(shutterSignal: SharedValue<number>) {
    takeNormalPhoto(shutterSignal)
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
