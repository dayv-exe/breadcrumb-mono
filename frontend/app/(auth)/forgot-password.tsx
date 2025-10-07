import CustomButton from "@/components/buttons/CustomButton";
import CustomLabel from "@/components/CustomLabel";
import CustomInput from "@/components/inputs/CustomInput";
import CustomModal from "@/components/modals/CustomModal";
import Spacer from "@/components/Spacer";
import CustomKeyboardAvoidingView from "@/components/views/CustomKeyboardAvoidingView";
import CustomScrollView from "@/components/views/CustomScrollView";
import { Colors } from "@/constants/Colors";
import { inputMode } from "@/constants/customInputModeTypes";
import { emailRegex } from "@/constants/regexes";
import { useAuthStore } from "@/utils/authStore";
import { useRouter } from "expo-router";
import { useState } from "react";
import Toast from "react-native-toast-message";

export default function ResetPasswordHomeScreen() {
  function showToast(message: string) {
    Toast.show({
      text1: message,
      type: "info"
    })
  }

  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [cNewPassword, setCNewPassword] = useState("")
  const [modalDetails, setModalDetails] = useState<{ isVisible: boolean, message: string }>({
    isVisible: false,
    message: ""
  })

  const [activityIndicator, setActivityIndicator] = useState(false)
  const router = useRouter()

  const [step, setStep] = useState(1)

  const { resetPasswordVerifyEmail, resetPassword } = useAuthStore()

  const getProceedBtnText = () => {
    return step === 1 ? "Send verification code" :
      step === 2 ? "Verify" :
        "Change password"
  }

  const handleNextStep = async () => {
    setActivityIndicator(true)
    if (step === 1) {
      if (!emailRegex.test(email)) {
        showToast("🚫 Invalid email!")
        return
      }

      const response = await resetPasswordVerifyEmail(email)
      if (response.isSuccess) {
        setStep(2)
      } else {
        showToast("🤔 Something went wrong, try again!")
      }
    } else if (step === 2) {
      if (code.length > 1) {
        setStep(3)
      } else { showToast("Invalid code!") }
    } else if (step === 3) {
      const response = await resetPassword(email, code, newPassword)
      if (!response.isSuccess) {
        setModalDetails({
          isVisible: true,
          message: "Incorrect verification code!"
        })

        setStep(2)
      } else {
        router.dismissTo("/login")
        showToast("👍 Password changed successfully!")
      }
    }

    setActivityIndicator(false)
  }

  const isPasswordValid = () => {
    return (newPassword !== cNewPassword || newPassword.length < 8) ? false : true
  }

  const handleProceedBtnDisabled = () => {
    return step === 1 ? !emailRegex.test(email) :
      step === 2 ? code.length < 2 :
        !isPasswordValid()
  }

  const handleConfirmPasswordInfo = (): string => {
    if (newPassword !== cNewPassword) {
      return "passwords don't match!"
    } else if (newPassword.length < 8) {
      return "❗️ must be 8 or more characters long"
    }
    return ""
  }

  const handleConfirmPasswordMode = (): inputMode => {
    return !isPasswordValid() ? "warn" : "normal"
  }

  const getEmailInfoText = (): string => {
    if (email.length < 1) {
      return "the email you created your account with"
    } else if (!emailRegex.test(email)) {
      return "doesn't look right yet"
    } else {
      return ""
    }
  }

  const getEmailInputMode = (): inputMode => {
    return email.length < 1 || emailRegex.test(email) ? "normal" : "warn"
  }

  return (
    <CustomKeyboardAvoidingView backgroundColor={Colors.light.vibrantBackground}>
      <CustomModal show={modalDetails.isVisible} message={modalDetails.message} handleClose={() => setModalDetails({ ...modalDetails, isVisible: false })} closeBtnText="Try again" />
      <CustomScrollView>
        {step === 1 &&
          <>
            <CustomLabel bold fade labelText="Step 1 of 3" textAlign="center" />
            <Spacer size="big" />
            <CustomInput labelText="Email: " infoText={getEmailInfoText()} value={email} setValue={e => setEmail(e)} keyboardType="email-address" inputMode={getEmailInputMode()} showInfoTextAlways forceLowercase />
          </>
        }
        {step === 2 &&
          <>
            <CustomLabel bold fade labelText="Step 2 of 3" textAlign="center" />
            <Spacer size="big" />
            <CustomInput labelText="Verification code: " infoText="enter the verification code we sent you" value={code} setValue={setCode} showInfoTextAlways />
          </>
        }
        {step === 3 &&
          <>
            <CustomLabel bold fade labelText="Step 3 of 3" textAlign="center" />
            <Spacer size="big" />
            <CustomInput labelText="New password: " infoText="" value={newPassword} setValue={setNewPassword} isPassword />
            <CustomInput labelText="Confirm new password: " infoText={handleConfirmPasswordInfo()} inputMode={handleConfirmPasswordMode()} value={cNewPassword} setValue={setCNewPassword} isPassword showInfoTextAlways />
          </>
        }
      </CustomScrollView>

      <CustomButton labelText={getProceedBtnText()} type="prominent" handleClick={handleNextStep} disabled={handleProceedBtnDisabled()} isPending={activityIndicator} />
      <Spacer size="big" />
    </CustomKeyboardAvoidingView>
  )
}