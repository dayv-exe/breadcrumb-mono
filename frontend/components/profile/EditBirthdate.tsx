import { useCheckBirthdate } from "@/hooks/useCheckBirthdate"
import { useEffect, useRef, useState } from "react"
import { TextInput } from "react-native"
import CustomLabel from "../CustomLabel"
import Spacer from "../Spacer"
import CustomButton from "../buttons/CustomButton"
import CustomDatePicker from "../inputs/CustomDatePicker"

export default function EditBirthdate() {
  const inputRef = useRef<TextInput>(null)
  const { birthdateToString, rawBirthdate, setBirthdate, validateBirthdate } = useCheckBirthdate()
  const [pickerMoving, setPickerMoving] = useState(false)

  function disableUpdateBtn() {
    const validation = validateBirthdate()
    return !validation.isValid || pickerMoving
  }

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <>
      <CustomLabel adaptToTheme labelText={`If you update your birthdate now you might NOT be able to update it again in the future.`} fade italic fontSize={14} />
      <CustomDatePicker
        date={rawBirthdate}
        dateStr={birthdateToString(rawBirthdate)}
        setDate={setBirthdate}
        setPickerMoving={setPickerMoving}
        adaptToTheme
      />
      <Spacer />
      <CustomButton disabled={disableUpdateBtn()} type="less-prominent" labelText="Update" />
    </>
  )
}