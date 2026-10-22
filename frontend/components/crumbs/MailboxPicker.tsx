import { StyleSheet, View } from "react-native";
import CustomButton from "../buttons/CustomButton";
import CustomLabel from "../CustomLabel";
import Spacer from "../Spacer";

export default function MailboxPicker() {
  return (
    <View
      style={[styles.container, {

      }]}
    >
      <CustomLabel adaptToTheme textAlign="center" labelText="Mailbox" fontSize={21} bold />

      <CustomButton
        freed
        type="text"
      >
        <CustomLabel adaptToTheme labelText="Unopened" />
      </CustomButton>

      <Spacer size="small" />
      <CustomButton
        freed
        type="text"
      >
        <CustomLabel adaptToTheme labelText="Sent" />
      </CustomButton>

      <Spacer size="small" />
      <CustomButton
        freed
        type="text"
      >
        <CustomLabel adaptToTheme labelText="Saved" />
      </CustomButton>

      <Spacer size="big" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
  }
})