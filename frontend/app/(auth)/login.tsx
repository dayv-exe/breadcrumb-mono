import { loginDetails } from "@/api/models/userDetails";
import CustomButton from "@/components/buttons/CustomButton";
import CustomInput from "@/components/inputs/CustomInput";
import CustomModal from "@/components/modals/CustomModal";
import Spacer from "@/components/Spacer";
import CustomKeyboardAvoidingView from "@/components/views/CustomKeyboardAvoidingView";
import CustomScrollView from "@/components/views/CustomScrollView";
import { Colors } from "@/constants/Colors";
import { useAuthStore } from "@/utils/authStore";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Toast from "react-native-toast-message";

export default function LoginScreen() {
  const router = useRouter()

  const [loginDetails, setLoginDetails] = useState<loginDetails>({
    email: "",
    password: ""
  })

  const [popupDetails, setPopupDetails] = useState<{ isVisible: boolean, message: string }>({
    isVisible: false,
    message: ""
  })

  const [isPending, setIsPending] = useState(false)

  const { login } = useAuthStore()

  const handleClosePopup = () => {
    setPopupDetails({
      isVisible: false,
      message: ""
    })
  }

  const handleForgotPassword = () => {
    router.push("/forgot-password")
  }

  const isDisabled = (): boolean => {
    return loginDetails.email.length < 1 || loginDetails.password.length < 1
  }

  const handleLogin = async () => {
    setIsPending(true)
    const res = await login(loginDetails.email, loginDetails.password)
    if (!res.isSuccess) {
      Toast.show({
        text1: "🚫 Incorrect login details",
        type: "info"
      })

      setLoginDetails({
        ...loginDetails,
        password: ""
      })
    }
    setIsPending(false)
  }

  return (
    <CustomKeyboardAvoidingView backgroundColor={Colors.light.vibrantBackground}>
      <CustomModal show={popupDetails.isVisible} message={popupDetails.message} closeBtnText="Okay" handleClose={handleClosePopup} />
      <CustomScrollView>
        <Spacer />
        <CustomInput keyboardType="email-address" value={loginDetails.email} setValue={e => setLoginDetails({ ...loginDetails, email: e })} labelText="Email:" infoText="" forceLowercase />
        <Spacer />
        <CustomInput value={loginDetails.password} setValue={e => setLoginDetails({ ...loginDetails, password: e })} isPassword labelText="Password:" infoText="" handleForgotPassword={handleForgotPassword} />
      </CustomScrollView>

      <View style={styles.buttonView}>
        <CustomButton type="prominent" labelText="Login" handleClick={handleLogin} disabled={isDisabled()} isPending={isPending} />
        <Spacer />
        <Spacer />
      </View>
    </CustomKeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  buttonView: {
    width: "80%",
  }
})