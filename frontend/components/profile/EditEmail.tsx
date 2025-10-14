import { EMAIL_CHANGE_DELAY } from "@/constants/appConstants";
import { useCheckEmail } from "@/hooks/useCheckEmail";
import { useCompleteEmailChange, useEmailVerificationStatus, useRequestEmailUpdate, useResendEmailChangeCode } from "@/hooks/useCognitoEmail";
import { useEffect, useRef, useState } from "react";
import { TextInput, View } from "react-native";
import Toast from "react-native-toast-message";
import CustomButton from "../buttons/CustomButton";
import CustomLabel from "../CustomLabel";
import CustomInput from "../inputs/CustomInput";
import Spacer from "../Spacer";

type props = {
  oldEmail: string
  onUpdate: () => void
}

type NewEmailProps = {
  oldEmail: string
  setStep: (n: number) => void
}

function ShowToast(message: string) {
  Toast.show({
    text1: message,
    position: "bottom",
    type: "info",
  })
}

function NewEmailSection({ oldEmail, setStep }: NewEmailProps) {
  const { email, emailInfoText, emailInputMode, emailValid, setEmail } = useCheckEmail(oldEmail)

  const inputRef = useRef<TextInput>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function disableUpdateBtn() {
    return oldEmail === email || !emailValid
  }

  async function handleClick() {
    const { error, success } = await requestEmailUpdate(email)

    if (success) {
      setStep(1)
    } else if (error) {
      ShowToast(error ?? "Something went wrong")
    }
  }

  const { requestEmailUpdate, pending: reqUpdateEmailPending } = useRequestEmailUpdate()

  return (
    <View>
      <CustomLabel adaptToTheme textAlign="center" labelText={`Step 1 of 2`} fade fontSize={14} />
      <CustomInput value={email} setValue={setEmail} infoText={emailInfoText} inputMode={emailInputMode} ref={inputRef} adaptToTheme labelText={"Email"} showInfoTextAlways autoCapitalize="none" forceLowercase keyboardType="email-address" disableAutoCorrect useLessProminentColors />
      <Spacer />
      <CustomLabel adaptToTheme labelText={`You can update your name only once every ${EMAIL_CHANGE_DELAY} days.`} fade italic fontSize={14} />
      <Spacer size="small" />
      <CustomButton isPending={reqUpdateEmailPending} handleClick={handleClick} disabled={disableUpdateBtn()} type="less-prominent" labelText="Send Verification Code" />
    </View>
  )
}

function VerifyEmailSection({ onUpdate }: props) {
  const [code, setCode] = useState("")
  const { resendEmailChangeCode, pending: codePending } = useResendEmailChangeCode()

  const { completeEmailChange, pending: changePending } = useCompleteEmailChange()

  function disableUpdateBtn() {
    return code.length < 1
  }

  async function handleResendEmail() {
    const { error, success } = await resendEmailChangeCode()
    if (error) {
      ShowToast(error ?? "🤔 something went wrong try again.")
    } else if (success) {
      ShowToast("👍 Sent another code!")
    }
  }

  async function handleUpdate() {
    const { error, success } = await completeEmailChange(code)
    if (error) {
      ShowToast(error)
    } else if (success) {
      ShowToast("👍 Email changed successfully")
      onUpdate()
    }
  }

  return (
    <View>
      <CustomLabel adaptToTheme textAlign="center" labelText={`Step 2 of 2`} fade fontSize={14} />
      <CustomInput value={code} setValue={setCode} infoText="enter the code we sent to your new email" inputMode="normal" adaptToTheme labelText={"Verification code"} showInfoTextAlways autoCapitalize="none" disableAutoCorrect useLessProminentColors />
      <Spacer />
      <CustomButton isPending={codePending} handleClick={handleResendEmail} labelText="Resend verification code" type="theme-faded" />
      <Spacer size="small" />
      <CustomButton isPending={changePending} handleClick={handleUpdate} disabled={disableUpdateBtn()} type="less-prominent" labelText="Update Email" />
    </View>
  )
}

export default function EditEmail({ oldEmail, onUpdate }: props) {
  const { emailVerificationStatus } = useEmailVerificationStatus()
  const [step, setStep] = useState(0)

  async function goToEmailConfirmation() {
    const res = await emailVerificationStatus()
    if (res) {
      // if email is verified
      setStep(0) // stay on change email page
    } else {
      // if current email is not verified go to verify page
      setStep(1)
    }
  }

  useEffect(() => {
    goToEmailConfirmation()
  }, [])

  return (
    <>
      {step === 0 &&
        <NewEmailSection setStep={setStep} oldEmail={oldEmail} />
      }
      {step === 1 &&
        <VerifyEmailSection onUpdate={onUpdate} oldEmail={oldEmail} />
      }
    </>
  )
}