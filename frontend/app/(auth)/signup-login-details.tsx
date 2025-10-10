import { signupDetails } from "@/api/models/userDetails";
import CustomButton from "@/components/buttons/CustomButton";
import CustomInput from "@/components/inputs/CustomInput";
import CustomModal from "@/components/modals/CustomModal";
import Spacer from "@/components/Spacer";
import CustomKeyboardAvoidingView from "@/components/views/CustomKeyboardAvoidingView";
import CustomScrollView from "@/components/views/CustomScrollView";
import { Colors } from "@/constants/Colors";
import { useCheckEmail } from "@/hooks/useCheckEmail";
import { useCheckPassword } from "@/hooks/useCheckPassword";
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
  const [popupDetails, setPopupDetails] = useState<{ isVisible: boolean, message: string }>({ isVisible: false, message: "" })
  const promptedUserToConfirmEmail = useRef(false)
  const [showActivityIndicator, setShowActivityIndicator] = useState(false)
  const {email: emailStr, setEmail, emailInfoText, emailInputMode, emailValid} = useCheckEmail()
  const {password: passwordStr, passwordInfoText, passwordInputMode, passwordValid, setPassword} = useCheckPassword()

  const { signUp } = useAuthStore()

  const handleSendVerification = async () => {
    setShowActivityIndicator(true)
    userDetails.email = emailStr
    userDetails.password = passwordStr
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
    return emailValid  && passwordValid
  }

  return (
    <CustomKeyboardAvoidingView backgroundColor={Colors.light.vibrantBackground}>
      <CustomModal show={popupDetails.isVisible} closeBtnText="Edit email" secondaryBtnText="Send verification code" message={popupDetails.message} handleClose={() => setPopupDetails({ ...popupDetails, isVisible: false })} handleSecondaryAction={handleSendVerification} />
      <Text style={styles.text}>Step 3 of 4</Text>
      <CustomScrollView>
        <Spacer />
        <CustomInput keyboardType="email-address" value={emailStr} setValue={setEmail} labelText="Email:" infoText={emailInfoText} showInfoTextAlways inputMode={emailInputMode} forceLowercase />
        <Spacer size="small" />
        <CustomInput value={passwordStr} setValue={setPassword} labelText="Password:" infoText={passwordInfoText} isPassword showInfoTextOnFocus inputMode={passwordInputMode} />
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