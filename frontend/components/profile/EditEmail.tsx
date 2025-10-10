import { USERNAME_CHANGE_DELAY } from "@/constants/appConstants";
import { useCheckEmail } from "@/hooks/useCheckEmail";
import { useEffect, useRef, useState } from "react";
import { TextInput, View } from "react-native";
import CustomButton from "../buttons/CustomButton";
import CustomLabel from "../CustomLabel";
import CustomInput from "../inputs/CustomInput";
import Spacer from "../Spacer";

type props = {
  oldEmail: string
}

type NewEmailProps = {
  setStep: (n: number) => void
}

function NewEmailSection({ oldEmail, setStep }: props & NewEmailProps) {
  const { email, emailInfoText, emailInputMode, emailValid, setEmail } = useCheckEmail(oldEmail)

  const inputRef = useRef<TextInput>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function disableUpdateBtn() {
    return oldEmail === email || !emailValid
  }

  function handleClick() {
    setStep(1)
  }

  return (
    <View>
      <CustomLabel adaptToTheme textAlign="center" labelText={`Step 1 of 2`} fade fontSize={14} />
      <CustomInput value={email} setValue={setEmail} infoText={emailInfoText} inputMode={emailInputMode} ref={inputRef} adaptToTheme labelText={"Email"} showInfoTextAlways autoCapitalize="none" forceLowercase keyboardType="email-address" disableAutoCorrect useLessProminentColors />
      <Spacer />
      <CustomLabel adaptToTheme labelText={`You can update your name only once every ${USERNAME_CHANGE_DELAY} days.`} fade italic fontSize={14} />
      <Spacer size="small" />
      <CustomButton handleClick={handleClick} disabled={disableUpdateBtn()} type="less-prominent" labelText="Send Verification Code" />
    </View>
  )
}

function VerifyEmailSection() {
  const [code, setCode] = useState("")

  const inputRef = useRef<TextInput>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function disableUpdateBtn() {
    return code.length < 0
  }

  return (
    <View>
      <CustomLabel adaptToTheme textAlign="center" labelText={`Step 2 of 2`} fade fontSize={14} />
      <CustomInput value={code} setValue={setCode} infoText="enter the code we sent to your new email" inputMode="normal" ref={inputRef} adaptToTheme labelText={"Verification code"} showInfoTextAlways autoCapitalize="none" disableAutoCorrect useLessProminentColors />
      <Spacer />
      <CustomLabel adaptToTheme labelText={`You can update your name only once every ${USERNAME_CHANGE_DELAY} days.`} fade italic fontSize={14} />
      <Spacer size="small" />
      <CustomButton disabled={disableUpdateBtn()} type="less-prominent" labelText="Update Email" />
    </View>
  )
}

export default function EditEmail({ oldEmail }: props) {
  const [step, setStep] = useState(0)

  return (
    <>
      {step === 0 &&
        <NewEmailSection setStep={setStep} oldEmail={oldEmail} />
      }
      {step === 1 &&
        <VerifyEmailSection />
      }
    </>
  )
}