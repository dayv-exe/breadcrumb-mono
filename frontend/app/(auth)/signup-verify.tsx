import CustomButton from "@/components/buttons/CustomButton";
import CustomLabel from "@/components/CustomLabel";
import CustomInput from "@/components/inputs/CustomInput";
import CustomModal from "@/components/modals/CustomModal";
import { useModal } from "@/components/modals/ModalContext";
import Spacer from "@/components/Spacer";
import CustomKeyboardAvoidingView from "@/components/views/CustomKeyboardAvoidingView";
import CustomScrollView from "@/components/views/CustomScrollView";
import { useAbortSignup } from "@/hooks/queries/useSignupApi";
import { useCreateUser } from "@/hooks/queries/useUserApi";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuthStore } from "@/utils/authStore";
import { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import Toast from "react-native-toast-message";

export default function SignupVerifyScreen() {
  const bgCol = useThemeColor({}, "background")
  const [code, setCode] = useState("")
  const { verifyEmail, resendSignUp, userEmail, userFullname, userNickname } = useAuthStore()
  const [popupDetails, setPopupDetails] = useState<{ isVisible: boolean, message: string }>({ isVisible: false, message: `Are you sure you want to cancel the signup process?` })
  const { cancelSignup, userId } = useAuthStore()
  const [activityIndicators, setActivityIndicators] = useState<{ verifyBtn: boolean, resendBtn: boolean }>({
    verifyBtn: false,
    resendBtn: false
  })
  const resetCodeCount = useRef(0)

  const { mutate: abort } = useAbortSignup()
  const { mutate: createUser } = useCreateUser()
  const { showModal, hideModal } = useModal()

  function handleErrorGracefully(err: string) {
    if (String(err).includes("CodeMismatchException") || String(err).includes("InvalidParameterException")) {
      Toast.show({
        text1: "Invalid verification code!",
        type: "info",
      })
    } else if (String(err).includes("EmptyConfirmSignUpCode")) {
      Toast.show({
        text1: "Enter the code to verify!",
        type: "info",
      })
    } else {
      // if any other unknown error occurs cancel signup completely
      if (String(err).includes("LimitExceededException")) {
        Toast.show({
          text1: "Too many attempts, try again after some time!",
          type: "info",
        })
      } else {
        Toast.show({
          text1: "Something went wrong please, try again!",
          type: "info",
        })
        showModal({
          message: "Something went wrong while we were trying to create your account, please try again after a while. Side note: make sure your full name does NOT contain any swear words as this could prevent us from creating your account.",
          onPrimary() {
            hideModal()
          },
        })
      }

      console.error(err)
      handleLeave()
    }
  }

  const handleVerify = async () => {
    setActivityIndicators({
      ...activityIndicators, verifyBtn: true
    })
    const res = await verifyEmail(code)
    if (!res.isSuccess) {
      handleErrorGracefully(res.info ?? "")
      setActivityIndicators({
        ...activityIndicators, verifyBtn: false
      })
    } else if (!res.sub) {
      handleErrorGracefully("no sub returned")
    } else if (res.isSuccess) {
      createUser({
        name: userFullname,
        nickname: userNickname,
        sub: res.sub
      }, {
        onSuccess: user => {
          if (user.error) {
            handleErrorGracefully(user.error)
          } else if (!user.error) {
            res.loginFn()
          } else {
            handleErrorGracefully("app in a state of limbo!")
          }
        },
        onError: err => {
          handleErrorGracefully(err.message)
        }
      })
    }
  }

  const handleResendCode = async () => {
    if (resetCodeCount.current >= 3) return

    setActivityIndicators({
      ...activityIndicators, resendBtn: true
    })
    const res = await resendSignUp()
    if (!res.isSuccess) {
      Toast.show({
        text1: "🤔 Something went wrong, try again.",
        type: "info",
      })
    } else {
      Toast.show({
        text1: "👍 Sent a new code!",
        type: "info",
      })
    }

    setActivityIndicators({
      ...activityIndicators, resendBtn: false
    })
  }

  const handleCancelRegistration = () => {
    setPopupDetails({
      ...popupDetails, isVisible: true
    })
  }

  const handleStay = () => {
    setPopupDetails({
      ...popupDetails, isVisible: false
    })
  }

  const handleLeave = () => {
    abort(userId) // delete from cognito
    cancelSignup()
  }

  return (
    <CustomKeyboardAvoidingView backgroundColor={bgCol}>
      <CustomModal show={popupDetails.isVisible} message={popupDetails.message} primaryBtnText="No, stay and continue" secondaryBtnText="Yes, leave" handleSecondaryAction={handleLeave} handleClose={handleStay} />
      <CustomLabel textAlign="center" labelText="Step 4 of 4" adaptToTheme fade />
      <CustomScrollView>
        <Spacer />
        <CustomInput adaptToTheme value={code} setValue={setCode} labelText="Verification code:" infoText={`enter the code we sent to ${userEmail}`} showInfoTextAlways />
        <Spacer />

        <View style={styles.buttonView}>
          <CustomButton type="prominent" labelText="Verify" handleClick={handleVerify} isPending={activityIndicators.verifyBtn} />
          <Spacer />
          <CustomButton type="theme-faded" labelText="Resend verification code" handleClick={handleResendCode} isPending={activityIndicators.resendBtn} disabled={resetCodeCount.current >= 3} />
          <Spacer size="big" />
          <CustomButton labelText="Cancel" adaptToTheme type="text" handleClick={handleCancelRegistration} />
        </View>
      </CustomScrollView>
    </CustomKeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  buttonView: {
    width: "80%",
  },
  text: {
    width: "100%",
    textAlign: "center",
    color: "#fff",
    opacity: .6,
    fontWeight: "700"
  }
})