import { ShowToast } from "@/constants/appConstants"
import { useCheckBirthdate } from "@/hooks/useCheckBirthdate"
import { useChangeBirthdate } from "@/hooks/useCognitoBirthdate"
import { useEffect, useRef, useState } from "react"
import { TextInput } from "react-native"
import CustomLabel from "../CustomLabel"
import Spacer from "../Spacer"
import CustomButton from "../buttons/CustomButton"
import CustomDatePicker from "../inputs/CustomDatePicker"

type props = {
  onUpdate: () => void
}

export default function EditBirthdate({ onUpdate }: props) {
  const inputRef = useRef<TextInput>(null)
  const { birthdateToString, rawBirthdate, setBirthdate, validateBirthdate } = useCheckBirthdate()
  const [pickerMoving, setPickerMoving] = useState(false)
  const { pending, updateBirthdate } = useChangeBirthdate()

  function disableUpdateBtn() {
    const validation = validateBirthdate()
    return !validation.isValid || pickerMoving
  }

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function handleUpdate() {
    const { success, error } = await updateBirthdate(birthdateToString(rawBirthdate))

    if (error) {
      ShowToast(error)
    } else if (success) {
      ShowToast("👍 Birthdate updated!")
      onUpdate()
    }
  }

  return (
    <>
      <CustomLabel adaptToTheme labelText={`If you change your birthdate now you might NOT be able to change it again in the future.`} fade italic fontSize={14} />
      <CustomDatePicker
        date={rawBirthdate}
        dateStr={birthdateToString(rawBirthdate)}
        setDate={setBirthdate}
        setPickerMoving={setPickerMoving}
        adaptToTheme
      />
      <Spacer />
      <CustomButton handleClick={handleUpdate} isPending={pending} disabled={disableUpdateBtn()} type="less-prominent" labelText="Update" />
    </>
  )
}