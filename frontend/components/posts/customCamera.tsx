
import { MAX_VIDEO_DURATION_MILLISECONDS } from "@/constants/appConstants";
import { Colors } from "@/constants/Colors";
import { showSettingsAlert } from "@/utils/helpers";
import { useRouter } from "expo-router";
import { PropsWithChildren, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, { cancelAnimation, Easing, Extrapolation, interpolate, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { Camera, CameraDevice, CameraProps, useCameraDevice, useCameraFormat, useCameraPermission, useMicrophonePermission } from "react-native-vision-camera";
import { scheduleOnRN } from "react-native-worklets";
import CustomButton from "../buttons/CustomButton";
import CustomImageButton from "../buttons/CustomImageButton";
import CustomLabel from "../CustomLabel";
import RecordingIndicator from "../recordingIndicator";
import Spacer from "../Spacer";
import RecordingProgressRing from "./recordingProgressRing";

const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera)

type camProps = {
  frontCam?: CameraDevice
  backCam?: CameraDevice
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

function CameraScreen({ frontCam, backCam }: camProps) {
  let availableCams: CameraDevice[] = []

  if (backCam !== null) availableCams.push(backCam!)
  if (frontCam !== null) availableCams.push(frontCam!)

  const [currentCam, setCurrentCam] = useState<CameraDevice>(availableCams[0])
  const progress = useSharedValue(0)
  const [isRecording, setIsRecording] = useState(false)
  const zoom = useSharedValue(currentCam.neutralZoom)
  const format = useCameraFormat(currentCam, [
    { photoResolution: { width: 1920, height: 1080 } }
  ])

  const router = useRouter()

  const handleTouchEnd = () => {
    // handles ending video recording when user lift finger from screen while recording
    setIsRecording(false)
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
      // const z = zoomOffset.value * event.scale
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

  function startRecording() {
    setIsRecording(true)
    progress.value = 0

    progress.value = withTiming(
      1,
      {
        duration: MAX_VIDEO_DURATION_MILLISECONDS,
        easing: Easing.linear,
      },
      (finished) => {
        scheduleOnRN(stopRecording)
      }
    )
  }

  function flipCamera() {
    if (availableCams.length < 2) return
    setCurrentCam(currentCam === availableCams[0] ? availableCams[1] : availableCams[0])
  }

  function stopRecording() {
    setIsRecording(false)
    cancelAnimation(progress)
    progress.value = 0
    zoom.value = 1
  }

  return (
    <GestureDetector gesture={gesture}>
      <View style={[styles.cameraContainer, {paddingBottom: 0}]}>
        <View style={styles.cameraWrapper}>
          <ReanimatedCamera
            enableZoomGesture
            style={[StyleSheet.absoluteFill, { backgroundColor: "black" }]}
            device={currentCam}
            isActive={true}
            animatedProps={animatedProps}
            audio={true}
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
        {!isRecording && <View style={[styles.topControls, {  }]}>
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
        <View style={styles.shutterContainer}>
          <View style={[styles.videoShutter, { backgroundColor: isRecording ? "red" : "transparent" }]} onTouchEnd={handleTouchEnd}>
            <TouchableOpacity delayLongPress={150} onLongPress={startRecording} style={[styles.photoShutter, { borderColor: isRecording ? "transparent" : "#ccc", backgroundColor: isRecording ? "transparent" : "white" }]}>
            </TouchableOpacity>
          </View>
          {isRecording && <RecordingProgressRing size={90} strokeWidth={10} progress={progress} />}
        </View>
        {!isRecording && <CrumbTypePicker />}
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
    backgroundColor: "white",
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
  }
})