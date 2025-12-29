import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Camera, CameraDevice, useCameraDevice } from 'react-native-vision-camera';

type MediaType = 'photo' | 'video' | null;

type MediaData = {
  uri: string;
  type: MediaType;
  duration?: number;
  thumbnail?: string;
};

type MediaPreview = {
  type: 'photo' | 'video'
  uri: string
}

type CameraContextType = {
  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;
  currentMedia: MediaData | null;
  setCurrentMedia: (media: MediaData | null) => void;

  resetCameraState: () => void
  handleSendMedia: () => void;
  handleDiscardMedia: () => void;
  onSendMedia?: (media: MediaData) => void | Promise<void>;
  setOnSendMedia: (callback: (media: MediaData) => void | Promise<void>) => void;
  mediaPreview: MediaPreview | null
  setMediaPreview: (media: MediaPreview) => void 

  flipCamera: () => void
  activeCamera: CameraDevice | null
  takePhoto: () => void
  cameraRef: React.RefObject<Camera | null>
  useFlash: boolean
  setUseFlash: (s: boolean) => void
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

  const backCamera = useCameraDevice("back")
  const frontCamera = useCameraDevice("front")

  const selectedCameraIndex = useRef(0)
  const [activeCamera, setActiveCamera] = useState<CameraDevice | null>(null)

  const availableCameras = useMemo<CameraDevice[]>(() => {
    const cams: CameraDevice[] = []
    if (backCamera) cams.push(backCamera)
    if (frontCamera) cams.push(frontCamera)
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

  const [mediaPreview, setMediaPreview] = useState<MediaPreview | null>(null)

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

  const cameraRef = useRef<Camera>(null)

  async function takePhoto() {
    if (cameraRef.current) {
      setMediaPreview({
        type: 'photo',
        uri: ``
      })
      try {
        const photo = await cameraRef.current.takePhoto({
          flash: 'off',
        })
        setMediaPreview({
          type: 'photo',
          uri: `file://${photo.path}`
        })
      } catch (error) {
        console.error('Error taking photo:', error)
      }
    }
  }

  const [useFlash, setUseFlash] = useState(false)

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
      flipCamera,
      activeCamera,
      mediaPreview,
      setMediaPreview,
      cameraRef,
      takePhoto,
      useFlash,
      setUseFlash,
    }}>
      {children}
    </CameraContext.Provider>
  );
}