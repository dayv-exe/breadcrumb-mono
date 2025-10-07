import { USERNAME_CHANGE_DELAY } from "@/constants/appConstants";
import { useEditUserInfo } from "@/hooks/queries/useEditUserInfo";
import { useCheckUsername } from "@/hooks/useCheckUsername";
import { useEffect, useRef } from "react";
import { TextInput } from "react-native";
import CustomButton from "../buttons/CustomButton";
import CustomLabel from "../CustomLabel";
import CustomInput from "../inputs/CustomInput";
import Spacer from "../Spacer";
import CustomKeyboardAvoidingView from "../views/CustomKeyboardAvoidingView";
import CustomScrollView from "../views/CustomScrollView";

type props = {
  oldUsername: string
}

export default function EditUsername({oldUsername}: props) {
  const { username, setUsername, isValid, handleFinalCheck, getInputMode, getInfoText } = useCheckUsername(oldUsername, "")
  const inputRef = useRef<TextInput>(null)
  const {mutate, error, } = useEditUserInfo()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function usernameUnchanged(): boolean{
    return oldUsername === username
  }

  function handleUpdate() {
    handleFinalCheck(isAvailable => {
      if (isAvailable) {
        // network call to update
      }
    })
  }

  return (
    <CustomKeyboardAvoidingView horizontalPadding={0}>
      <CustomScrollView>
        <CustomInput ref={inputRef} adaptToTheme labelText={"Username"} value={username} setValue={e => setUsername(e)} infoText={usernameUnchanged() ? "" : getInfoText()} inputMode={usernameUnchanged() ? "normal" : getInputMode()} showInfoTextAlways autoCapitalize="none" disableAutoCorrect forceLowercase useLessProminentColors />
        <CustomLabel adaptToTheme labelText={`You can update your username only once every ${USERNAME_CHANGE_DELAY} days.`} fade italic fontSize={14} />
        <Spacer />
      </CustomScrollView>

      <CustomButton disabled={!isValid || usernameUnchanged()} type="less-prominent" labelText="Update" handleClick={handleUpdate} />
    </CustomKeyboardAvoidingView>
  )
}