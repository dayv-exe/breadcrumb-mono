import { ShowToast, USERNAME_CHANGE_DELAY } from "@/constants/appConstants";
import { useEditUser } from "@/hooks/queries/useUserApi";
import { useCheckUsername } from "@/hooks/useCheckUsername";
import { View } from "react-native";
import CustomButton from "../buttons/CustomButton";
import CustomLabel from "../CustomLabel";
import CustomInput from "../inputs/CustomInput";
import Spacer from "../Spacer";

type props = {
  oldUsername: string
  onUpdate: () => void
  allowNicknameChange: boolean
}

export default function EditUsername({ oldUsername, onUpdate, allowNicknameChange }: props) {
  const { username, setUsername, isValid, handleFinalCheck, getInputMode, getInfoText } = useCheckUsername(oldUsername, "")
  const { mutate: editUsername, isPending } = useEditUser()

  function usernameUnchanged(): boolean {
    return oldUsername === username || !allowNicknameChange
  }

  function handleUpdate() {
    handleFinalCheck(isAvailable => {
      if (isAvailable) {
        editUsername({ target: "nickname", payload: username }, {
          onSuccess: () => {
            onUpdate()
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
        !allowNicknameChange &&
        <CustomLabel adaptToTheme labelText={`You changed your username recently, try again after a few days.`} fontSize={14} />
      }
      <CustomInput adaptToTheme labelText={"Username"} value={username} setValue={e => setUsername(e)} infoText={usernameUnchanged() ? "" : getInfoText()} inputMode={usernameUnchanged() ? "normal" : getInputMode()} showInfoTextAlways autoCapitalize="none" disableAutoCorrect forceLowercase useLessProminentColors />
      <CustomLabel adaptToTheme labelText={`You can update your username only once every ${USERNAME_CHANGE_DELAY} days.`} fontSize={14} />
      <Spacer />
      <CustomButton disabled={!isValid || usernameUnchanged()} type="less-prominent" labelText="Update" handleClick={handleUpdate} isPending={isPending} />
    </View>
  )
}