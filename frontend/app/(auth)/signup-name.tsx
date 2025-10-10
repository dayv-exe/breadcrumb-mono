import { signupDetails } from "@/api/models/userDetails";
import CustomButton from "@/components/buttons/CustomButton";
import CustomInput from "@/components/inputs/CustomInput";
import Spacer from "@/components/Spacer";
import CustomKeyboardAvoidingView from "@/components/views/CustomKeyboardAvoidingView";
import CustomScrollView from "@/components/views/CustomScrollView";
import { Colors } from "@/constants/Colors";
import { useCheckName } from "@/hooks/useCheckName";
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
  const {name, setName, getNameLabelText, NameValid, getNameInputMode} = useCheckName()

  const handleProceedToNextPage = () => {
    handleFinalCheck((valid) => {
      if (valid && NameValid()) {
        userDetails.username = username
        userDetails.fullname = name
        router.push({
          pathname: "/signup-birthdate",
          params: userDetails,
        });
      }
    });
  };

  function nextBtnDisabled(): boolean {
    if (!NameValid()) {
      return true // disable button if fullname is not valid
    }

    if (!isValid) {
      return true // disable next btn is the username is too long
    }
    return false
  }

  return (
    <CustomKeyboardAvoidingView backgroundColor={Colors.light.vibrantBackground}>
      <Text style={styles.text}>Step 1 of 4</Text>
      <CustomScrollView>
        <Spacer />
        <CustomInput value={username} setValue={e => setUsername(e)} labelText="Username:" infoText={getInfoText()} showInfoTextAlways disableAutoCorrect inputMode={getInputMode()} forceLowercase />

        <Spacer />

        <CustomInput value={name} setValue={setName} labelText="Fullname (optional):" infoText={getNameLabelText()} inputMode={getNameInputMode()} showInfoTextOnFocus disableAutoCorrect autoCapitalize="words" />
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