import CustomButton from "@/components/buttons/CustomButton";
import Spacer from "@/components/Spacer";
import CustomView from "@/components/views/CustomView";
import { Colors } from "@/constants/Colors";
import { useRouter } from "expo-router";
import { Image, StyleSheet, Text } from "react-native";

export default function AuthChoiceScreen() {
  const router = useRouter()

  return (
    <CustomView backgroundColor={Colors.light.vibrantBackground}>
      <Spacer />
      <Spacer />
      <Image style={styles.image} source={require("../../assets/images/bread-no-bg.png")} />
      <Spacer />
      <CustomButton handleClick={() => {
        router.push("/login")
      }} labelText="Login" type="prominent" />
      <Spacer />
      <Text style={styles.text}>Or</Text>
      <Spacer />
      <CustomButton handleClick={() => {
        router.push("/signup-name")
      }} labelText="Register" type="faded" />
    </CustomView>
  )
}

const styles = StyleSheet.create({
  image: {
    width: 100,
    height: 100,
  },

  text: {
    color: "#fff",
  }
})