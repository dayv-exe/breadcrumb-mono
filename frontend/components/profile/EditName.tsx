import { ShowToast, USERNAME_CHANGE_DELAY } from "@/constants/appConstants";
import { useEditUser } from "@/hooks/queries/useUserApi";
import { useCheckName } from "@/hooks/useCheckName";
import { View } from "react-native";
import CustomButton from "../buttons/CustomButton";
import CustomLabel from "../CustomLabel";
import CustomInput from "../inputs/CustomInput";
import Spacer from "../Spacer";

type props = {
  oldName: string
  onUpdate: () => void
  allowNameChange: boolean
}

export default function EditName({ oldName, onUpdate, allowNameChange }: props) {
  const { NameValid, getNameInputMode, getNameLabelText, name, setName } = useCheckName(oldName, "", true)

  const { mutate: editName, isPending } = useEditUser()


  function nameIsInvalid() {
    if (oldName.trim() === name.trim()) return true
    else if (!NameValid()) return true
    else if (!allowNameChange) return true

    return false
  }

  function disableUpdateBtn() {
    return nameIsInvalid()
  }

  function handleUpdate() {
    if (nameIsInvalid()) {
      console.log("invalid name")
      return
    }

    editName({ target: "name", payload: name }, {
      onSuccess: res => {
        if (!res.error) {
          ShowToast("Updated name successfully")
          onUpdate()
        } else {
          ShowToast("failed to update name")
        }
      },

      onError: err => {
        ShowToast(err.message)
      }
    })
  }

  return (
    <View>
      {!allowNameChange &&
        <>
          <CustomLabel adaptToTheme labelText={`You changed your name recently, try again after a few days.`} fontSize={14} />
          <Spacer size="small" />
        </>
      }
      <CustomInput value={name} setValue={setName} infoText={getNameLabelText()} inputMode={getNameInputMode()} adaptToTheme labelText={"Name"} showInfoTextAlways autoCapitalize="words" disableAutoCorrect useLessProminentColors />
      <CustomLabel adaptToTheme labelText={`You can update your name only once every ${USERNAME_CHANGE_DELAY} days.`} fontSize={14} />
      <Spacer />
      <CustomButton handleClick={handleUpdate} isPending={isPending} disabled={disableUpdateBtn()} type="less-prominent" labelText="Update" />
    </View>
  )
}