import { signupDetails } from "@/api/models/userDetails";
import CustomButton from "@/components/buttons/CustomButton";
import CustomLabel from "@/components/CustomLabel";
import CustomDatePicker from "@/components/inputs/CustomDatePicker";
import CustomModal from "@/components/modals/CustomModal";
import Spacer from "@/components/Spacer";
import CustomScrollView from "@/components/views/CustomScrollView";
import CustomView from "@/components/views/CustomView";
import { useCheckBirthdate } from "@/hooks/useCheckBirthdate";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

export default function BirthdateScreen() {
  const bgCol = useThemeColor({}, "background")
  const [popupDetails, setPopupDetails] = useState<{ isVisible: boolean, message: string }>({ isVisible: false, message: "" })
  const { username, fullname, birthdate, email, password } = useLocalSearchParams<signupDetails>()
  const [userDetails, setUserDetails] = useState<signupDetails>({
    username: username,
    fullname: fullname,
    birthdate: birthdate,
    email: email,
    password: password
  })
  const router = useRouter()
  const [pickerMoving, setPickerMoving] = useState(true)
  const { rawBirthdate, setBirthdate, validateBirthdate, birthdateToString } = useCheckBirthdate()

  function handleChange(date: Date) {
    setBirthdate(date)
    setUserDetails({ ...userDetails, birthdate: birthdateToString(date) })
  }

  const handleValidateBirthdate = () => {
    const validation = validateBirthdate()

    if (!validation.isValid) {
      setPopupDetails({
        isVisible: true,
        message: validation.reason
      })
    } else {
      router.push({
        pathname: "/signup-login-details",
        params: userDetails
      })
    }
  }

  return (
    <CustomView backgroundColor={bgCol}>
      {popupDetails.isVisible && <CustomModal message={popupDetails.message} show={popupDetails.isVisible} closeBtnText="Close" handleClose={() => {
        setPopupDetails({ ...popupDetails, isVisible: false })
        router.dismissAll()
      }} />}
      <CustomLabel adaptToTheme textAlign="center" labelText="Step 2 of 4" fade />
      <CustomScrollView>
        <Spacer />
        <CustomDatePicker
          adaptToTheme
          date={rawBirthdate}
          dateStr={birthdateToString(rawBirthdate)}
          setDate={handleChange}
          setPickerMoving={setPickerMoving}
        />
      </CustomScrollView>

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