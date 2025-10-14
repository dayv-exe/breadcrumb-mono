import { ShowToast, USERNAME_CHANGE_DELAY } from "@/constants/appConstants";
import { useEditUserDetails } from "@/hooks/queries/useEditUserDetails";
import { useCheckUsername } from "@/hooks/useCheckUsername";
import { useDateConverter } from "@/hooks/useDateConverter";
import { View } from "react-native";
import CustomButton from "../buttons/CustomButton";
import CustomLabel from "../CustomLabel";
import CustomInput from "../inputs/CustomInput";
import Spacer from "../Spacer";

type props = {
  oldUsername: string
  onUpdate: () => void
  lastNicknameChange: string
}

export default function EditUsername({ oldUsername, onUpdate, lastNicknameChange }: props) {
  const { username, setUsername, isValid, handleFinalCheck, getInputMode, getInfoText } = useCheckUsername(oldUsername, "")
  const { mutate: editUsername, isPending } = useEditUserDetails()
  const {nameChangeTooSoon} = useDateConverter()

  function usernameUnchanged(): boolean {
    return oldUsername === username || nameChangeTooSoon(lastNicknameChange, USERNAME_CHANGE_DELAY)
  }

  function handleUpdate() {
    handleFinalCheck(isAvailable => {
      if (isAvailable) {
        editUsername({ target: "nickname", payload: username }, {
          onSuccess: res => {
            if (res.successful) {
              ShowToast("👍 Username changed successfully!")
              onUpdate()
            }
          },
          onError: err => {
            ShowToast("Failed to update username")
          }
        })
      }
    })
  }

  return (
    <View>
      {
        nameChangeTooSoon(lastNicknameChange, USERNAME_CHANGE_DELAY) &&
        <CustomLabel adaptToTheme labelText={`You changed your username recently, try again after a few days.`} fontSize={14} />
      }
      <CustomInput adaptToTheme labelText={"Username"} value={username} setValue={e => setUsername(e)} infoText={usernameUnchanged() ? "" : getInfoText()} inputMode={usernameUnchanged() ? "normal" : getInputMode()} showInfoTextAlways autoCapitalize="none" disableAutoCorrect forceLowercase useLessProminentColors />
      <CustomLabel adaptToTheme labelText={`You can update your username only once every ${USERNAME_CHANGE_DELAY} days.`} fontSize={14} />
      <Spacer />
      <CustomButton disabled={!isValid || usernameUnchanged()} type="less-prominent" labelText="Update" handleClick={handleUpdate} isPending={isPending} />
    </View>
  )
}