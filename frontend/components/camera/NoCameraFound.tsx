import { StyleSheet, View } from "react-native";
import CustomLabel from "../CustomLabel";

export default function NoCameraFound() {
  return (
    <View style={styles.container}>
      <CustomLabel textAlign="center" labelText="🤔" fontSize={21} />
      <CustomLabel width={"80%"} labelText="it appears that this device does not have a camera." textAlign="center" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "80%"
  }
})