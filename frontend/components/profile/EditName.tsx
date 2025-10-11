import { USERNAME_CHANGE_DELAY } from "@/constants/appConstants";
import { useCheckName } from "@/hooks/useCheckName";
import { useEffect, useRef } from "react";
import { TextInput, View } from "react-native";
import CustomButton from "../buttons/CustomButton";
import CustomLabel from "../CustomLabel";
import CustomInput from "../inputs/CustomInput";
import Spacer from "../Spacer";

type props = {
  oldName: string
}

export default function EditName({ oldName }: props) {
  const inputRef = useRef<TextInput>(null)

  const {NameValid, getNameInputMode, getNameLabelText, name, setName} = useCheckName(oldName, "", true)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function disableUpdateBtn() {
    return oldName === name.trim() || !NameValid()
  }

  return (
    <View>
      <CustomInput value={name} setValue={setName} infoText={getNameLabelText()} inputMode={getNameInputMode()} ref={inputRef} adaptToTheme labelText={"Name"} showInfoTextAlways autoCapitalize="words" disableAutoCorrect useLessProminentColors />
      <CustomLabel adaptToTheme labelText={`You can update your name only once every ${USERNAME_CHANGE_DELAY} days.`} fade italic fontSize={14} />
      <Spacer />
      <CustomButton disabled={disableUpdateBtn()} type="less-prominent" labelText="Update" />
    </View>
  )
}