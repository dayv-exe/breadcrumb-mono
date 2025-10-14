import { NAME_CHANGE_DELAY, ShowToast, USERNAME_CHANGE_DELAY } from "@/constants/appConstants";
import { useEditUserDetails } from "@/hooks/queries/useEditUserDetails";
import { useCheckName } from "@/hooks/useCheckName";
import { useDateConverter } from "@/hooks/useDateConverter";
import { View } from "react-native";
import CustomButton from "../buttons/CustomButton";
import CustomLabel from "../CustomLabel";
import CustomInput from "../inputs/CustomInput";
import Spacer from "../Spacer";

type props = {
  oldName: string
  onUpdate: () => void
  lastNameChangeDate: string
}

export default function EditName({ oldName, onUpdate, lastNameChangeDate }: props) {
  const { NameValid, getNameInputMode, getNameLabelText, name, setName } = useCheckName(oldName, "", true)
  const { nameChangeTooSoon } = useDateConverter()

  const { mutate: editName, isPending } = useEditUserDetails()


  function nameIsInvalid() {
    if (oldName.trim() === name.trim()) return true
    else if (!NameValid()) return true
    else if (nameChangeTooSoon(lastNameChangeDate, NAME_CHANGE_DELAY)) return true

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
        if (res.successful) {
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
      {nameChangeTooSoon(lastNameChangeDate, NAME_CHANGE_DELAY) &&
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