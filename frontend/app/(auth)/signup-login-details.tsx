import { signupDetails } from "@/api/models/userDetails";
import CustomButton from "@/components/buttons/CustomButton";
import CustomInput from "@/components/inputs/CustomInput";
import CustomModal from "@/components/modals/CustomModal";
import Spacer from "@/components/Spacer";
import CustomKeyboardAvoidingView from "@/components/views/CustomKeyboardAvoidingView";
import CustomScrollView from "@/components/views/CustomScrollView";
import { Colors } from "@/constants/Colors";
import { inputMode } from "@/constants/customInputModeTypes";
import { emailRegex } from "@/constants/regexes";
import { useAuthStore } from "@/utils/authStore";
import { useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";

export default function SignupDetailsScreen() {
  const { username, fullname, birthdate, email, password } = useLocalSearchParams<signupDetails>()
  const [userDetails, setUserDetails] = useState<signupDetails>({
    username: username,
    fullname: fullname,
    birthdate: birthdate,
    email: email,
    password: password
  })
  const [emailInfo, setEmailInfo] = useState<{ infoTxt: string, inputMode: inputMode }>({ infoTxt: "", inputMode: "normal" })
  const [popupDetails, setPopupDetails] = useState<{ isVisible: boolean, message: string }>({ isVisible: false, message: "" })
  const promptedUserToConfirmEmail = useRef(false)
  const [showActivityIndicator, setShowActivityIndicator] = useState(false)

  const getPasswordInfo = (): string => {
    if (userDetails.password.length < 1) {
      return "choose a strong password"
    } else if (userDetails.password.length >= 8) {
      return ""
    }
    return userDetails.password.length < 1 || userDetails.password.length >= 8 ? "choose a strong password" : "❗️ must be at least 8 characters long"
  }
  const getPasswordInputMode = (): inputMode => {
    return userDetails.password.length < 1 ? "normal" : userDetails.password.length < 8 ? "warn" : "normal"
  }

  const { signUp } = useAuthStore()

  const handleSendVerification = async () => {
    setShowActivityIndicator(true)
    const response = await signUp(userDetails)

    if (!response.isSuccess) {
      let message = "🤔 Something went wrong, try again."
      if (String(response.info).includes("UsernameExistsException")) {
        message = "😬 this email is already in use!"
      }
      setShowActivityIndicator(false)
      Toast.show({
        type: "info",
        text1: message,
        text2: response.info ?? ""
      })
    }
    setPopupDetails({
      ...popupDetails,
      isVisible: false
    })
  }

  const handleSubmit = () => {
    if (!emailAndPasswordValid()) return

    if (!promptedUserToConfirmEmail.current) {
      setPopupDetails({
        isVisible: true,
        message: `We'll send a verification code to "${userDetails.email}" to complete your signup.`
      })
      promptedUserToConfirmEmail.current = true
    } else {
      // if user has double checked their email
      handleSendVerification()
    }
  }

  const emailAndPasswordValid = (): boolean => {
    return emailRegex.test(userDetails.email) && userDetails.password.length >= 8
  }

  function handleEmailTextChange(e: string) {
    setUserDetails({ ...userDetails, email: e })
    if (emailRegex.test(e) || e.length < 1) {
      setEmailInfo({ infoTxt: "🔒 other users won't see this", inputMode: "normal" })
    } else {
      setEmailInfo({ infoTxt: "❗️ doesn't look right yet", inputMode: "warn" })
    }
  }

  return (
    <CustomKeyboardAvoidingView backgroundColor={Colors.light.vibrantBackground}>
      <CustomModal show={popupDetails.isVisible} closeBtnText="Edit email" secondaryBtnText="Send verification code" message={popupDetails.message} handleClose={() => setPopupDetails({ ...popupDetails, isVisible: false })} handleSecondaryAction={handleSendVerification} />
      <Text style={styles.text}>Step 3 of 4</Text>
      <CustomScrollView>
        <Spacer />
        <CustomInput keyboardType="email-address" value={userDetails.email} setValue={e => handleEmailTextChange(e)} labelText="Email:" infoText={emailInfo.infoTxt} showInfoTextAlways inputMode={emailInfo.inputMode} forceLowercase />
        <Spacer size="small" />
        <CustomInput value={userDetails.password} setValue={e => setUserDetails({ ...userDetails, password: e })} labelText="Password:" infoText={getPasswordInfo()} isPassword showInfoTextOnFocus inputMode={getPasswordInputMode()} />
        <Spacer />
      </CustomScrollView>

      <View style={styles.buttonView}>
        <CustomButton disabled={!emailAndPasswordValid()} type="prominent" labelText="Send verification code" handleClick={handleSubmit} isPending={showActivityIndicator} />
        <Spacer />
        <Spacer />
      </View>
    </CustomKeyboardAvoidingView>
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