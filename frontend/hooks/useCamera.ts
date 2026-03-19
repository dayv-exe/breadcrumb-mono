import { MAX_AUDIO_DURATION_MILLISECONDS, MAX_PREVIEW_MEDIA, MAX_VIDEO_DURATION_MILLISECONDS } from "@/constants/appConstants";
import { useMediaStore } from "@/utils/mediaStore";
import {
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState
} from 'expo-audio';
import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
  PhotoFile,
  useCameraDevice,
  VideoFile,
} from "react-native-vision-camera";
import { scheduleOnRN } from "react-native-worklets";
import { v4 as uuidv4 } from "uuid";
import { useShallow } from "zustand/shallow";
import { useMediaPermissions } from "./usePermissions";

type useCameraReturnType = {
  flipCamera: () => void;
  takePhoto: () => void;
  setUseFlash: (s: "on" | "off") => void;
  startRecording: () => void;
  stopRecording: () => void;

  startAudioRecording: () => void
  finishAudioRecording: () => void
  cancelAudioRecording: () => void

  recordingProgress: SharedValue<number>;
  audioRecordingProgress: SharedValue<number>;
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
  const { addMediaPreview, setIsRecording, mediaPreview, setShowMediaPreview, replaceMediaPreview } = useMediaStore(
    useShallow(s => ({
      addMediaPreview: s.addMediaPreview,
      replaceMediaPreview: s.replaceMediaPreview,
      setIsRecording: s.setIsRecording,
      mediaPreview: s.mediaPreview,
      setShowMediaPreview: s.setShowMediaPreviews,
    }))
  );
  const mediaPrevLen = useRef(mediaPreview.length)
  useEffect(() => {
    mediaPrevLen.current = mediaPreview.length
  }, [mediaPreview])
  const { requestRecordingPermission } = useMediaPermissions()

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

  const vidPlaceHolderFrame = useRef<PhotoFile | null>(null)
  const recordingProgress = useSharedValue(0);
  const zoomLevel = useSharedValue(activeCamera?.neutralZoom ?? 1);
  const format = useMemo(() => {
    return activeCamera?.formats.find(
      (f) => f.videoWidth === 1920 && f.videoHeight === 1080 && f.maxFps >= 28,
    );
  }, [activeCamera]);

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY)
  const recorderState = useAudioRecorderState(audioRecorder)

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
          onRecordingFinished: (video: VideoFile) => {
            addMediaPreview({
              id: uuidv4(),
              type: "video",
              uri: normalizeFileUri(video.path),
              resizeMode: "cover",
            });

            if (shouldAutoRestart.current) {
              shouldAutoRestart.current = false
              startRecording()
            } else {
              setShowMediaPreview(true)
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

  async function takeQuickPhoto() {
    const camera = cameraRef.current;
    let placeholderIndex = -1
    if (camera) {
      try {
        const photoPromise = camera.takePhoto({
          flash: useFlash,
          enableShutterSound: false
        })

        const snapshotPromise = camera.takeSnapshot({
          quality: 0,
        })

        const snapshot = await snapshotPromise
        placeholderIndex = addMediaPreview({
          id: uuidv4(),
          type: "photo",
          uri: normalizeFileUri(snapshot.path),
          resizeMode: "cover",
          isPlaceholder: true,
        });
        setShowMediaPreview(true)

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid).catch(() => { });
        const photo = await photoPromise
        replaceMediaPreview(placeholderIndex, {
          id: uuidv4(),
          type: "photo",
          uri: normalizeFileUri(photo.path),
          resizeMode: "cover",
          isPlaceholder: false
        });
      } catch (error) {
        console.error("Error taking photo:", error);
      }
    }
  }

  async function takeNormalPhoto() {
    if (cameraRef.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)
      try {
        const photo = await cameraRef.current.takePhoto({
          flash: useFlash,
          enableShutterSound: false
        });
        addMediaPreview({
          id: uuidv4(),
          type: "photo",
          uri: normalizeFileUri(photo.path),
          resizeMode: "cover"
        });
        setShowMediaPreview(true)
      } catch (error) {
        console.error("Error taking photo:", error);
      }
    }
  }

  async function takePhoto() {
    if (useFlash === "on") {
      takeNormalPhoto()
    } else {
      // takeQuickPhoto()
      takeNormalPhoto()
    }
  }

  const [useFlash, setUseFlash] = useState<"on" | "off">("off");

  const audioRecordingProgress = useSharedValue(0);

  async function startAudioRecording() {
    const perms = await requestRecordingPermission();
    if (!perms) return;
    await audioRecorder.prepareToRecordAsync();
    await setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
    });

    audioRecordingProgress.value = 0;
    audioRecordingProgress.value = withTiming(
      1,
      {
        duration: MAX_AUDIO_DURATION_MILLISECONDS,
        easing: Easing.linear,
      },
      (finished) => {
        if (finished) {
          scheduleOnRN(finishAudioRecording);
        }
      },
    );

    setIsRecording(true)
    audioRecorder.record();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)
  }

  async function cancelAudioRecording() {
    setIsRecording(false)
    await audioRecorder.stop();
    cancelAnimation(audioRecordingProgress);
    audioRecordingProgress.value = 0;
  }

  async function finishAudioRecording(addToPreview = false) {
    await cancelAudioRecording()
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)
    if (audioRecorder.uri) {
      addMediaPreview({
        id: uuidv4(),
        resizeMode: "contain",
        type: "audio",
        uri: normalizeFileUri(audioRecorder.uri)
      })
      setShowMediaPreview(true)
    } else {
      console.error("Failed to find recording!")
    }
  }

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
    startAudioRecording,
    finishAudioRecording,
    cancelAudioRecording,
    audioRecordingProgress,
  };
}
