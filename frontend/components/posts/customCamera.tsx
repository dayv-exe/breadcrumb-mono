import { MAX_VIDEO_DURATION_MILLISECONDS } from "@/constants/appConstants";
import { Colors } from "@/constants/Colors";
import { showSettingsAlert } from "@/utils/helpers";
import { useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from 'expo-video';
import { PropsWithChildren, useRef, useState } from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, { cancelAnimation, Easing, Extrapolation, interpolate, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { Camera, CameraDevice, CameraProps, useCameraDevice, useCameraFormat, useCameraPermission, useMicrophonePermission, VideoFile } from "react-native-vision-camera";
import { scheduleOnRN } from "react-native-worklets";
import CustomButton from "../buttons/CustomButton";
import CustomImageButton from "../buttons/CustomImageButton";
import CustomLabel from "../CustomLabel";
import RecordingIndicator from "../recordingIndicator";
import Spacer from "../Spacer";
import CameraModeCarousel, { CameraMode } from './CameraModeCarousel';
import RecordingProgressRing from "./recordingProgressRing";


const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera)

type camProps = {
  frontCam?: CameraDevice
  backCam?: CameraDevice
}

type MediaPreview = {
  type: 'photo' | 'video'
  uri: string
}

function ControlButtonContainer({ children }: PropsWithChildren) {
  return (
    <View style={{
      backgroundColor: "rgba(0, 0, 0, 0)",
      padding: 2,
      borderRadius: "100%",
    }}>
      {children}
    </View>
  )
}

function CrumbTypePicker() {
  return (
    <View style={[styles.pickerContainer, { backgroundColor: Colors.light.backgroundOverlay }]}>
      <CustomButton squashed width={"auto"} type="faded" labelText="Photo & video" />
      <Spacer size="small" />
      <CustomButton squashed type="text" labelText="Text" />
    </View>
  )
}

type PreviewScreenProps = {
  media: MediaPreview
  onRetake: () => void
  onSave: () => void
}

function PreviewScreen({ media, onRetake, onSave }: PreviewScreenProps) {
  const player = useVideoPlayer(media.type === 'video' ? media.uri : '', player => {
    if (media.type === 'video') {
      player.loop = true;
      player.play();
    }
  });

  return (
    <View style={styles.previewContainer}>
      <View style={styles.previewMediaWrapper}>
        {media.type === 'photo' ? (
          <Image
            source={{ uri: media.uri }}
            style={styles.previewMedia}
            resizeMode="cover"
          />
        ) : (
          <VideoView
            player={player!}
            style={styles.previewMedia}
            contentFit="cover"
            nativeControls={false}
          />
        )}
      </View>

      <View style={styles.previewControls}>
        <CustomButton
          type="text"
          labelText="Retake"
          handleClick={onRetake}
        />
        <Spacer size="medium" />
        <CustomButton
          type="prominent"
          labelText="Save"
          handleClick={onSave}
        />
      </View>
    </View>
  )
}

function CameraScreen({ frontCam, backCam }: camProps) {
  let availableCams: CameraDevice[] = []

  if (backCam !== null) availableCams.push(backCam!)
  if (frontCam !== null) availableCams.push(frontCam!)

  const cameraRef = useRef<Camera>(null)
  const [currentCam, setCurrentCam] = useState<CameraDevice>(availableCams[0])
  const [mediaPreview, setMediaPreview] = useState<MediaPreview | null>(null)
  const progress = useSharedValue(0)
  const [isRecording, setIsRecording] = useState(false)
  const zoom = useSharedValue(currentCam.neutralZoom)
  const format = useCameraFormat(currentCam, [
    { photoResolution: { width: 1920, height: 1080 } },
    { fps: 30 }
  ])

  const [cameraMode, setCameraMode] = useState<CameraMode>('Photo');
  const CAMERA_MODES: CameraMode[] = ['Photo', 'Video', 'Portrait', 'Night', 'Slo-Mo'];
  const router = useRouter()
  const handleModeChange = (mode: CameraMode) => {
    setCameraMode(mode);
  };

  const handleTouchEnd = () => {
    if (isRecording) {
      stopRecording()
    }
  }

  const zoomOffset = useSharedValue(0);
  const gesture = Gesture.Pan()
    .onBegin(() => {
      zoomOffset.value = zoom.value
    })
    .onUpdate(event => {
      const zoomDelta = -event.translationY / 30
      const z = zoomOffset.value + zoomDelta
      if (!isRecording) return
      zoom.value = interpolate(
        z,
        [1, 15],
        [currentCam.minZoom, 15],
        Extrapolation.CLAMP,
      )
    })
    .onEnd(() => {
      scheduleOnRN(handleTouchEnd)
    })

  const animatedProps = useAnimatedProps<CameraProps>(
    () => ({ zoom: zoom.value }),
    [zoom]
  )

  async function takePhoto() {
    if (cameraRef.current) {
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

  async function startRecording() {
    if (cameraRef.current) {
      try {
        setIsRecording(true)
        progress.value = 0

        progress.value = withTiming(
          1,
          {
            duration: MAX_VIDEO_DURATION_MILLISECONDS,
            easing: Easing.linear,
          },
          (finished) => {
            if (finished) {
              scheduleOnRN(stopRecording)
            }
          }
        )

        await cameraRef.current.startRecording({
          flash: 'off',
          onRecordingFinished: (video: VideoFile) => {
            setMediaPreview({
              type: 'video',
              uri: `file://${video.path}`
            })
            setIsRecording(false)
          },
          onRecordingError: (error) => {
            console.error('Recording error:', error)
            setIsRecording(false)
          },
        })
      } catch (error) {
        console.error('Error starting recording:', error)
        setIsRecording(false)
      }
    }
  }

  function flipCamera() {
    if (availableCams.length < 2) return
    setCurrentCam(currentCam === availableCams[0] ? availableCams[1] : availableCams[0])
  }

  async function stopRecording() {
    if (cameraRef.current && isRecording) {
      try {
        await cameraRef.current.stopRecording()
        cancelAnimation(progress)
        progress.value = 0
        zoom.value = 1
      } catch (error) {
        console.error('Error stopping recording:', error)
      }
    }
  }

  function handleRetake() {
    setMediaPreview(null)
  }

  function handleSave() {
    // TODO: add save logic here
    setMediaPreview(null)
  }

  // show preview screen if media was captured
  if (mediaPreview) {
    return (
      <PreviewScreen
        media={mediaPreview}
        onRetake={handleRetake}
        onSave={handleSave}
      />
    )
  }

  return (
    <GestureDetector gesture={gesture}>
      <View style={[styles.cameraContainer, { paddingBottom: 0 }]}>
        <View style={styles.cameraWrapper}>
          <ReanimatedCamera
            ref={cameraRef}
            enableZoomGesture
            style={[StyleSheet.absoluteFill, { backgroundColor: "black" }]}
            device={currentCam}
            isActive={true}
            animatedProps={animatedProps}
            audio={true}
            photo={true}
            video={true}
            format={format}
          />
        </View>
        {isRecording && <RecordingIndicator />}
        {<View style={styles.cameraControls}>
          <TouchableOpacity>
            <CustomImageButton type="text" src={require("../../assets/images/icons/noflash_sel_light.png")} size={25} fitToContent />
            <Spacer size="tiny" />

          </TouchableOpacity>
          <View onTouchStart={flipCamera}>
            <Spacer />
            <CustomImageButton type="text" src={require("../../assets/images/icons/flipcamera_sel_light.png")} size={25} fitToContent />
            <Spacer size="tiny" />
          </View>
        </View>}
        {!isRecording && <View style={[styles.topControls, {}]}>
          <ControlButtonContainer>
            <CustomImageButton fitToContent type="text" src={require("../../assets/images/icons/searchfriends_sel_light.png")} size={22} handleClick={() => router.push("/find-friends")} />
          </ControlButtonContainer>
          <ControlButtonContainer>
            <CustomImageButton type="text" src={require("../../assets/images/icons/walls_sel_light.png")} size={22} handleClick={() => router.push("/create-wall")} fitToContent />
          </ControlButtonContainer>
        </View>}
        {!isRecording && <View style={styles.galleryContainer}>
          <CustomImageButton type="text" src={require("../../assets/images/icons/gallery_unsel_light.png")} size={30} />
        </View>}
        {!isRecording && (
          <View style={styles.modeCarouselContainer}>
            <CameraModeCarousel
              modes={CAMERA_MODES}
              selectedMode={cameraMode}
              onModeChange={handleModeChange}
            />
          </View>
        )}
        <View style={styles.shutterContainer}>
          <View style={[styles.videoShutter, { backgroundColor: isRecording ? "red" : "transparent" }]} onTouchEnd={handleTouchEnd}>
            <TouchableOpacity
              delayLongPress={150}
              onPress={takePhoto}
              onLongPress={startRecording}
              style={[styles.photoShutter, { borderColor: isRecording ? "transparent" : "#ccc", backgroundColor: isRecording ? "transparent" : "transparent" }]}
            >
            </TouchableOpacity>
          </View>
          {isRecording && <RecordingProgressRing size={90} strokeWidth={10} progress={progress} />}
        </View>
        {!isRecording &&
            <CrumbTypePicker />
          }
      </View>
    </GestureDetector>
  )
}

function NoCameraFoundScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "black" }}>
      <CustomLabel textAlign="center" labelText="🤔" fontSize={21} />
      <CustomLabel width={"80%"} labelText="it appears that this device does not have a camera." textAlign="center" />
    </View>
  )
}

type noPermProps = {
  missingPermissions: string[]
  requestPerms: () => void
}
function NoPermissionScreen({ missingPermissions, requestPerms }: noPermProps) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "black" }}>
      <CustomLabel textAlign="center" labelText="🔐" fontSize={21} />
      <CustomLabel width={"80%"} labelText={`Allow ${missingPermissions.join(" and ")} access to start creating.`} textAlign="center" />
      <CustomButton type="less-vibrant-text" labelText="Grant Permissions" handleClick={requestPerms} />
    </View>
  )
}

export default function CustomCamera() {
  const backCam = useCameraDevice("back")
  const frontCam = useCameraDevice("front")
  const { hasPermission: hasCamPermission, requestPermission: reqCamPermission } = useCameraPermission()
  const { hasPermission: hasMicPermission, requestPermission: reqMicPermission } = useMicrophonePermission()

  async function requestPerms() {
    if (!hasCamPermission) {
      const status = await reqCamPermission()
      if (!status) {
        showSettingsAlert("Camera and Microphone")
      }
    } else if (!hasMicPermission) {
      const status = await reqMicPermission()
      if (!status) {
        showSettingsAlert("Microphone")
      }
    }
  }

  if (!hasCamPermission || !hasMicPermission) {
    let missingPermissions = []

    if (!hasCamPermission) missingPermissions.push("camera")
    if (!hasMicPermission) missingPermissions.push("microphone")

    return (
      <NoPermissionScreen missingPermissions={missingPermissions} requestPerms={requestPerms} />
    )
  }

  if (backCam == null && frontCam == null) return (
    <NoCameraFoundScreen />
  )

  return (
    <CameraScreen frontCam={frontCam} backCam={backCam} />
  )
}

const styles = StyleSheet.create({
  cameraContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    backgroundColor: "black"
  },
  shutterContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    bottom: 55,
  },
  photoShutter: {
    borderRadius: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 7,
    width: 80,
    height: 80,
  },
  videoShutter: {
    borderRadius: "100%",
    padding: 10
  },
  videoShutterInner: {

  },
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 50,
    position: "absolute",
    bottom: 12,
    padding: 5
  },
  cameraControls: {
    position: "absolute",
    right: 5,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 100,
    paddingTop: 13,
    paddingHorizontal: 10,
    paddingBottom: 10,
    opacity: .9
  },
  topControls: {
    position: "absolute",
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    top: 15,
    paddingHorizontal: 20,
  },
  galleryContainer: {
    position: "absolute",
    alignItems: "center",
    bottom: 75,
    left: 45,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 5,
    borderRadius: 100,
    opacity: .9
  },
  cameraWrapper: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: "hidden",
    backgroundColor: "black",
  },
  previewContainer: {
    flex: 1,
    backgroundColor: "black",
  },
  previewMediaWrapper: {
    flex: 1,
    width: "100%",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: "hidden",
  },
  previewMedia: {
    width: "100%",
    height: "100%",
  },
  previewControls: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modeCarouselContainer: {
    position: 'absolute',
    bottom: 85,
    width: '100%',
  },
})