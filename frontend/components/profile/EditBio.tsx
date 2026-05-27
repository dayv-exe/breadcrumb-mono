import { ShowToast } from "@/constants/appConstants"
import { useEditUser } from "@/hooks/queries/useUserApi"
import { useCheckBio } from "@/hooks/useCheckBio"
import { View } from "react-native"
import Spacer from "../Spacer"
import CustomButton from "../buttons/CustomButton"
import CustomInput from "../inputs/CustomInput"

type props = {
  oldBio: string
  onUpdate: () => void
}

export default function EditBio({ oldBio, onUpdate }: props) {
  const { bio, setBio, bioInfoText, bioInputMode, bioValid } = useCheckBio(oldBio)
  const { mutate: editBio, isPending } = useEditUser()

  function handleUpdate() {
    editBio({ target: "bio", payload: bio.trim() }, {
      onSuccess: () => {
        onUpdate()
      },

      onError: err => {
        ShowToast("failed to update bio, try again")
        console.log(err)
      }
    })
  }

  function disableUpdateBtn() {
    return oldBio.trim() === bio.trim() || !bioValid
  }

  return (
    <View>
      <CustomInput multiline value={bio} setValue={setBio} infoText={bioInfoText} inputMode={bioInputMode} adaptToTheme labelText={"Bio"} showInfoTextAlways autoCapitalize="sentences" disableAutoCorrect useLessProminentColors />
      <Spacer />
      <CustomButton isPending={isPending} handleClick={handleUpdate} disabled={disableUpdateBtn()} type="less-prominent" labelText="Update" />
    </View>
  )
}