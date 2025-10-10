import { useCheckBio } from "@/hooks/useCheckBio"
import { useEffect, useRef } from "react"
import { TextInput, View } from "react-native"
import Spacer from "../Spacer"
import CustomButton from "../buttons/CustomButton"
import CustomInput from "../inputs/CustomInput"

type props = {
  oldBio: string
}

export default function EditBio({ oldBio }: props) {
  const inputRef = useRef<TextInput>(null)
  const { bio, setBio, bioInfoText, bioInputMode, bioValid } = useCheckBio(oldBio)

  function disableUpdateBtn() {
    return oldBio === bio || !bioValid
  }

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <View>
      <CustomInput multiline value={bio} setValue={setBio} infoText={bioInfoText} inputMode={bioInputMode} ref={inputRef} adaptToTheme labelText={"Bio"} showInfoTextAlways autoCapitalize="sentences" disableAutoCorrect useLessProminentColors />
      <Spacer />
      <CustomButton disabled={disableUpdateBtn()} type="less-prominent" labelText="Update" />
    </View>
  )
}