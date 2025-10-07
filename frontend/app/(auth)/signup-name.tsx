import { signupDetails } from "@/api/models/userDetails";
import CustomButton from "@/components/buttons/CustomButton";
import CustomInput from "@/components/inputs/CustomInput";
import Spacer from "@/components/Spacer";
import CustomKeyboardAvoidingView from "@/components/views/CustomKeyboardAvoidingView";
import CustomScrollView from "@/components/views/CustomScrollView";
import { MAX_FULLNAME_LEN } from "@/constants/appConstants";
import { Colors } from "@/constants/Colors";
import { inputMode } from "@/constants/customInputModeTypes";
import { emojiRegex } from "@/constants/regexes";
import { useCheckUsername } from "@/hooks/useCheckUsername";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function SignupNameScreen() {
  const [userDetails, setUserDetails] = useState<signupDetails>({
    username: "",
    fullname: "",
    birthdate: new Date().toLocaleDateString(),
    email: "",
    password: ""
  })
  const router = useRouter()

  const { username, setUsername, isValid, handleFinalCheck, getInputMode, getInfoText } = useCheckUsername()

  const handleProceedToNextPage = () => {
    handleFinalCheck((valid) => {
      if (valid && fullnameValid()) {
        userDetails.username = username
        router.push({
          pathname: "/signup-birthdate",
          params: userDetails,
        });
      }
    });
  };

  function nextBtnDisabled(): boolean {
    if (!fullnameValid()) {
      return true // disable button if fullname is not valid
    }

    if (!isValid) {
      return true // disable next btn is the username is too long
    }
    return false
  }
  function fullnameValid(): boolean {
    if (userDetails.fullname && userDetails.fullname.length > MAX_FULLNAME_LEN) {
      return false
    }

    if (emojiRegex.test(userDetails.fullname ?? "")) {
      return false
    }

    return true
  }

  function getFullNameFeedback(): { text: string, mode: inputMode } {
    if (userDetails.fullname && userDetails.fullname.length > MAX_FULLNAME_LEN) {
      return { text: `🚫 cannot be greater than ${MAX_FULLNAME_LEN} characters`, mode: "warn" }
    }

    if (emojiRegex.test(userDetails.fullname ?? "")) {
      return { text: `add emojis after completing the signup process`, mode: "warn" }
    }

    return { text: "helps your friends find you", mode: "normal" }
  }

  return (
    <CustomKeyboardAvoidingView backgroundColor={Colors.light.vibrantBackground}>
      <Text style={styles.text}>Step 1 of 4</Text>
      <CustomScrollView>
        <Spacer />
        <CustomInput value={username} setValue={e => setUsername(e)} labelText="Username:" infoText={getInfoText()} showInfoTextAlways disableAutoCorrect inputMode={getInputMode()} forceLowercase />

        <Spacer />

        <CustomInput value={userDetails.fullname ?? ""} setValue={e => setUserDetails({ ...userDetails, fullname: e })} labelText="Fullname (optional):" infoText={getFullNameFeedback().text} inputMode={getFullNameFeedback().mode} showInfoTextOnFocus disableAutoCorrect autoCapitalize="words" />
        <Spacer />
      </CustomScrollView>

      <View style={styles.buttonView}>
        <CustomButton type="prominent" labelText="Next" handleClick={handleProceedToNextPage} disabled={nextBtnDisabled()} />
        <Spacer />
        <Spacer />
      </View>
    </CustomKeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  usernameContainer: {
    width: "100%",
    flexDirection: "row"
  },
  buttonView: {
    width: "80%",
  },
  text: {
    fontSize: 15,
    color: "#fff",
    opacity: .6,
    fontWeight: "700"
  }
})