import { useCheckPassword } from "@/hooks/useCheckPassword";
import { useChangePassword } from "@/hooks/useCognitoPassword";
import { useEffect, useRef, useState } from "react";
import { TextInput, View } from "react-native";
import Toast from "react-native-toast-message";
import CustomButton from "../buttons/CustomButton";
import CustomInput from "../inputs/CustomInput";
import Spacer from "../Spacer";

function showToast(message: string) {
  Toast.show({
    text1: message,
    type: "info",
    position: "bottom"
  })
}

type prop = {
  onUpdate: () => void
}

export default function EditPassword({ onUpdate }: prop) {
  const inputRef = useRef<TextInput>(null)

  const { password, passwordInfoText, passwordInputMode, passwordValid, setPassword } = useCheckPassword()

  const [oldPassword, setOldPassword] = useState("")

  const { changePassword, pending } = useChangePassword()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function disableUpdateBtn() {
    return !passwordValid && oldPassword.length > 0
  }

  async function handleChangePassword() {
    const { success, error } = await changePassword(oldPassword, password)

    if (error) {
      showToast(error)
    } else if (success) {
      showToast("👍 Password changed successfully!")
      onUpdate()
    }
  }

  return (
    <View>
      <CustomInput value={oldPassword} setValue={setOldPassword} ref={inputRef} adaptToTheme labelText={"Old password"} showInfoTextAlways autoCapitalize="none" isPassword disableAutoCorrect useLessProminentColors />

      <Spacer size="small" />

      <CustomInput value={password} setValue={setPassword} infoText={passwordInfoText} inputMode={passwordInputMode} adaptToTheme labelText={"New password"} showInfoTextAlways autoCapitalize="none" isPassword disableAutoCorrect useLessProminentColors />
      <Spacer />
      <CustomButton handleClick={handleChangePassword} isPending={pending} disabled={disableUpdateBtn()} type="less-prominent" labelText="Update" />
    </View>
  )
}