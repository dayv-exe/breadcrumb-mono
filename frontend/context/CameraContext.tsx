import { showSettingsAlert } from '@/utils/helpers';
import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CameraDevice, useCameraDevice, useCameraPermission, useMicrophonePermission } from 'react-native-vision-camera';

type MediaType = 'photo' | 'video' | null;

type MediaData = {
  uri: string;
  type: MediaType;
  duration?: number;
  thumbnail?: string;
};

type CameraContextType = {
  isPreviewActive: boolean;
  setIsPreviewActive: (active: boolean) => void;

  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;

  currentMedia: MediaData | null;
  setCurrentMedia: (media: MediaData | null) => void;

  resetCameraState: () => void

  handleSendMedia: () => void;
  handleDiscardMedia: () => void;
  onSendMedia?: (media: MediaData) => void | Promise<void>;
  setOnSendMedia: (callback: (media: MediaData) => void | Promise<void>) => void;

  flipCamera: () => void
  activeCamera: CameraDevice | null

  hasCameraPermissions: boolean
  hasMicPermissions: boolean
  requestMediaPermissions: () => void
};

const CameraContext = createContext<CameraContextType | undefined>(undefined);

export const useCameraState = () => {
  const context = useContext(CameraContext);
  if (!context) {
    throw new Error('useCameraState must be used within a CameraProvider');
  }
  return context;
};

export function CameraProvider({ children }: { children: ReactNode }) {
  const [isPreviewActive, setIsPreviewActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const [currentMedia, setCurrentMedia] = useState<MediaData | null>(null);
  const [onSendMedia, setOnSendMedia] = useState<((media: MediaData) => void | Promise<void>) | undefined>();

  const { hasPermission: hasCameraPermissions, requestPermission: reqCamPermission } = useCameraPermission()
  const { hasPermission: hasMicPermissions, requestPermission: reqMicPermission } = useMicrophonePermission()

  const backCamera = useCameraDevice("back")
  const frontCamera = useCameraDevice("front")

  const selectedCameraIndex = useRef(0)
  const [activeCamera, setActiveCamera] = useState<CameraDevice | null>(null)

  const availableCameras = useMemo<CameraDevice[]>(() => {
    const cams: CameraDevice[] = []
    if (frontCamera) cams.push(frontCamera)
    if (backCamera) cams.push(backCamera)
    return cams
  }, [frontCamera, backCamera])

  useEffect(() => {
    if (availableCameras.length > 0) {
      selectedCameraIndex.current = 0
      setActiveCamera(availableCameras[0])
    }
  }, [availableCameras])



  function flipCamera() {
    if (availableCameras.length < 2) return

    selectedCameraIndex.current =
      selectedCameraIndex.current === 0 ? 1 : 0

    setActiveCamera(availableCameras[selectedCameraIndex.current])
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

  const handleSendMedia = async () => {
    if (!currentMedia) return;

    // Call the custom callback if set
    if (onSendMedia) {
      await onSendMedia(currentMedia);
    }

    resetCameraState()
  };

  const handleDiscardMedia = () => {
    // when user cancels preview
    if (currentMedia?.uri) {
      // delete from temp or whatever
    }

  };

  const resetCameraState = () => {
    setIsPreviewActive(false);
    setIsRecording(false);
    setCurrentMedia(null);
  }

  return (
    <CameraContext.Provider value={{
      isPreviewActive,
      setIsPreviewActive,
      isRecording,
      setIsRecording,
      currentMedia,
      setCurrentMedia,
      handleSendMedia,
      handleDiscardMedia,
      onSendMedia,
      setOnSendMedia,
      resetCameraState,
      hasCameraPermissions,
      hasMicPermissions,
      requestMediaPermissions,
      flipCamera,
      activeCamera,
    }}>
      {children}
    </CameraContext.Provider>
  );
}