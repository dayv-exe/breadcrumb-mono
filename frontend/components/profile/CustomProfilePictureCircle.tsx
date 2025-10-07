import { useThemeColor } from "@/hooks/useThemeColor";
import { StyleSheet, View } from "react-native";
import CustomLabel from "../CustomLabel";
import Spacer from "../Spacer";

type props = {
  size?: number
  showInstruction?: boolean
}

export default function CustomProfilePictureCircle({ size = 100, showInstruction }: props) {
  // if no url then use fg and bg colors
  const theme = useThemeColor
  const hasProfilePicture = false

  return (
    <View style={styles.container}>
      <View style={[
        styles.circle,
        {
          backgroundColor: theme({}, "fadedBackground"),
          width: size,
          height: size,
        }
      ]}>
      </View>
      {showInstruction &&
        <View>
          <Spacer size="small" />
          <CustomLabel fade adaptToTheme labelText={hasProfilePicture ? "Long press circle to preview" : "Tap circle to set picture"} />
        </View>
      }
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center"
  },
  circle: {
    borderRadius: "100%"
  }
})