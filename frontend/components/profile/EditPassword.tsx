import { useCheckPassword } from "@/hooks/useCheckPassword";
import { useEffect, useRef, useState } from "react";
import { TextInput, View } from "react-native";
import CustomButton from "../buttons/CustomButton";
import CustomInput from "../inputs/CustomInput";
import Spacer from "../Spacer";

export default function EditPassword() {
  const inputRef = useRef<TextInput>(null)

  const { password, passwordInfoText, passwordInputMode, passwordValid, setPassword } = useCheckPassword()

  const [oldPassword, setOldPassword] = useState("")

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function disableUpdateBtn() {
    return !passwordValid && oldPassword.length > 0
  }

  return (
    <View>
      <CustomInput value={oldPassword} setValue={setOldPassword} ref={inputRef} adaptToTheme labelText={"Old password"} showInfoTextAlways autoCapitalize="none" isPassword disableAutoCorrect useLessProminentColors />

      <Spacer size="small" />

      <CustomInput value={password} setValue={setPassword} infoText={passwordInfoText} inputMode={passwordInputMode} adaptToTheme labelText={"New password"} showInfoTextAlways autoCapitalize="none" isPassword disableAutoCorrect useLessProminentColors />
      <Spacer />
      <CustomButton disabled={disableUpdateBtn()} type="less-prominent" labelText="Update" />
    </View>
  )
}