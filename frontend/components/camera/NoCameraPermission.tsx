import { StyleSheet, View } from "react-native"
import CustomLabel from "../CustomLabel"
import CustomButton from "../buttons/CustomButton"

type noPermProps = {
  missingPermissions: string[]
  requestPerms: () => void
}
export default function NoCameraPermission({ missingPermissions, requestPerms }: noPermProps) {
  return (
    <View style={styles.container}>
      <CustomLabel textAlign="center" labelText="🔐" fontSize={21} />
      <CustomLabel width={"80%"} labelText={`Allow ${missingPermissions.join(" and ")} access to start creating.`} textAlign="center" />
      <CustomButton type="less-vibrant-text" labelText="Grant Permissions" handleClick={requestPerms} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "black",

  }
})