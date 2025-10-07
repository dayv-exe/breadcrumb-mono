import CustomButton from "@/components/buttons/CustomButton";
import CustomInput from "@/components/inputs/CustomInput";
import CustomModal from "@/components/modals/CustomModal";
import Spacer from "@/components/Spacer";
import CustomKeyboardAvoidingView from "@/components/views/CustomKeyboardAvoidingView";
import CustomScrollView from "@/components/views/CustomScrollView";
import { Colors } from "@/constants/Colors";
import { useAbortSignup } from "@/hooks/queries/useAbortSignup";
import { useAuthStore } from "@/utils/authStore";
import { useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";

export default function SignupVerifyScreen() {
  const [code, setCode] = useState("")
  const { verifyEmail, resendSignUp, userEmail } = useAuthStore()
  const [popupDetails, setPopupDetails] = useState<{ isVisible: boolean, message: string }>({ isVisible: false, message: `Are you sure you want to cancel the signup process?` })
  const { cancelSignup, userId } = useAuthStore()
  const [activityIndicators, setActivityIndicators] = useState<{ verifyBtn: boolean, resendBtn: boolean }>({
    verifyBtn: false,
    resendBtn: false
  })
  const resetCodeCount = useRef(0)

  const { mutate: abort } = useAbortSignup()

  const handleVerify = async () => {
    setActivityIndicators({
      ...activityIndicators, verifyBtn: true
    })
    const res = await verifyEmail(code)
    if (!res.isSuccess) {
      if (String(res.info).includes("CodeMismatchException") || String(res.info).includes("InvalidParameterException")) {
        Toast.show({
          text1: "Invalid verification code!",
          type: "info",
        })
      } else if (String(res.info).includes("EmptyConfirmSignUpCode")) {
         Toast.show({
          text1: "Enter the code to verify!",
          type: "info",
        })
      } else {
        // if any other unknown error occurs cancel signup completely
        if (String(res.info).includes("LimitExceededException")) {
          Toast.show({
            text1: "Too many attempts, try again after some time!",
            type: "info",
          })
        } else {
          Toast.show({
            text1: "Something went wrong please, try again!",
            type: "info",
          })
        }
        handleLeave()
      }

      setActivityIndicators({
        ...activityIndicators, verifyBtn: false
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
    <CustomKeyboardAvoidingView backgroundColor={Colors.light.vibrantBackground}>
      <CustomModal show={popupDetails.isVisible} message={popupDetails.message} closeBtnText="No, stay and continue" secondaryBtnText="Yes, leave" handleSecondaryAction={handleLeave} handleClose={handleStay} />
      <Spacer />
      <Text style={styles.text}>Step 4 of 4</Text>
      <CustomScrollView>
        <Spacer />
        <CustomInput value={code} setValue={setCode} labelText="Verification code:" infoText={`enter the code we sent to ${userEmail}`} showInfoTextAlways />
        <Spacer />

        <View style={styles.buttonView}>
          <CustomButton type="prominent" labelText="Verify" handleClick={handleVerify} isPending={activityIndicators.verifyBtn} />
          <Spacer />
          <CustomButton type="faded" labelText="Resend verification code" handleClick={handleResendCode} isPending={activityIndicators.resendBtn} disabled={resetCodeCount.current >= 3} />
          <Spacer size="big" />
          <CustomButton labelText="Cancel" type="text" handleClick={handleCancelRegistration} />
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