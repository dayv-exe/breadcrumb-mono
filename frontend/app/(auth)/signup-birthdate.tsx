import CustomButton from "@/components/buttons/CustomButton";
import CustomLabel from "@/components/CustomLabel";
import CustomDatePicker from "@/components/inputs/CustomDatePicker";
import { useModal } from "@/components/modals/ModalContext";
import Spacer from "@/components/Spacer";
import CustomView from "@/components/views/CustomView";
import { useCheckBirthdate } from "@/hooks/useCheckBirthdate";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuthStore } from "@/utils/authStore";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

export default function BirthdateScreen() {
  const bgCol = useThemeColor({}, "background")
  const router = useRouter()
  const [pickerMoving, setPickerMoving] = useState(true)
  const { rawBirthdate, setBirthdate, validateBirthdate, birthdateToString } = useCheckBirthdate()
  const { showModal, hideModal } = useModal()

  function handleChange(date: Date) {
    setBirthdate(date)
    useAuthStore.setState({
      birthdate: birthdateToString(date),
    })
    console.log(birthdateToString(date))
  }

  const handleValidateBirthdate = () => {
    const validation = validateBirthdate()

    if (!validation.isValid) {
      showModal({
        title: validation.title,
        message: validation.reason,
        onPrimary: () => {
          router.dismissAll()
          hideModal()
        },
        primaryBtnText: "Okay"
      })
    } else {
      router.push({
        pathname: "/signup-login-details",
      })
    }
  }

  return (
    <CustomView backgroundColor={bgCol}>
      <CustomLabel adaptToTheme textAlign="center" labelText="Step 2 of 4" fade />
      <Spacer />
      <CustomDatePicker
        adaptToTheme
        date={rawBirthdate}
        dateStr={birthdateToString(rawBirthdate)}
        setDate={handleChange}
        setPickerMoving={setPickerMoving}
      />
      <View style={styles.buttonView}>
        <CustomButton type="prominent" labelText="Next" handleClick={handleValidateBirthdate} disabled={pickerMoving} />
        <Spacer />
        <Spacer />
      </View>
    </CustomView>
  )
}

const styles = StyleSheet.create({
  buttonView: {
    width: "80%",
  },
  text: {
    color: "#fff",
    opacity: .6,
    fontWeight: "700"
  }
})