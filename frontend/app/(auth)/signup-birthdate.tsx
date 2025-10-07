import { signupDetails } from "@/api/models/userDetails";
import CustomButton from "@/components/buttons/CustomButton";
import CustomLabel from "@/components/CustomLabel";
import CustomModal from "@/components/modals/CustomModal";
import Spacer from "@/components/Spacer";
import CustomScrollView from "@/components/views/CustomScrollView";
import CustomView from "@/components/views/CustomView";
import { MAX_AGE, MAX_RIDICULOUS_AGE, MIN_AGE } from "@/constants/appConstants";
import { Colors } from "@/constants/Colors";
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

export default function BirthdateScreen() {
  const bDate = useRef(new Date())
  const [showPicker, setShowPicker] = useState(false);
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

  const formatDate = (date: Date) =>
    `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;


  const onChange = (_: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate ?? new Date();
    bDate.current = currentDate
    setUserDetails({ ...userDetails, birthdate: formatDate(currentDate) });
    setShowPicker(false)
    setPickerMoving(false)
  };

  const handleShowPicker = () => {
    setShowPicker(true);
  };

  const handleValidateBirthdate = () => {
    const today = new Date();

    let age = today.getFullYear() - bDate.current.getFullYear();
    const monthDiff = today.getMonth() - bDate.current.getMonth();
    const dayDiff = today.getDate() - bDate.current.getDate();

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      // to adujust for when bday hasnt happened yet
      age--;
    }

    if (age < 0) {
      setPopupDetails({
        isVisible: true,
        message: `Unfortunately, you haven't been born yet 😬`
      })
    } else if (age > MAX_RIDICULOUS_AGE) {
      setPopupDetails({
        isVisible: true,
        message: "😂 lol"
      })
    } else if (age > MAX_AGE) {
      setPopupDetails({
        isVisible: true,
        message: `💀💀💀 Unfortunately, you need to be alive to use this app `
      })
    } else if (age < MIN_AGE) {
      setPopupDetails({
        isVisible: true,
        message: "😬 Unfortunately, you're too young to use this app, come back in a few years"
      })
    } else {
      router.push({
        pathname: "/signup-login-details",
        params: userDetails
      })
    }
  }

  return (
    <CustomView backgroundColor={Colors.light.vibrantBackground}>
      {popupDetails.isVisible && <CustomModal message={popupDetails.message} show={popupDetails.isVisible} closeBtnText="Close" handleClose={() => {
        setPopupDetails({ ...popupDetails, isVisible: false })
        router.dismissAll()
      }} />}
      <Text style={styles.text}>Step 2 of 4</Text>
      <CustomScrollView>
        <Spacer />
        <View style={{ width: "100%" }}>
          <CustomLabel labelText="Birthdate:" bold />
          <CustomButton labelText={userDetails.birthdate} type="faded" handleClick={handleShowPicker} />
          <CustomLabel labelText="🔒 other users won't see this" fontSize={15} />
        </View>
        <Spacer />
        {(Platform.OS === "ios" || showPicker) && <DateTimePicker
          testID="dateTimePicker"
          value={bDate.current}
          mode="date"
          onChange={onChange}
          display="spinner"
          themeVariant="dark"
          onTouchMove={() => setPickerMoving(true)}
        />}
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