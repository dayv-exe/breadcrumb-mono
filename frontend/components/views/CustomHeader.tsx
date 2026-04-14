import { useColorScheme } from "@/hooks/useColorScheme.web";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomFloatingSquare from "../buttons/CustomFloatingSquare";
import CustomImageButton from "../buttons/CustomImageButton";
import CustomLabel from "../CustomLabel";

const icons = {
  back: {
    light: require("../../assets/images/icons/back_sel_light.png"),
    dark: require("../../assets/images/icons/back_sel_dark.png")
  },
}

function getIconImage(name: keyof typeof icons, darkMode: boolean) {
  const theme = darkMode ? "dark" : "light"
  return icons[name][theme]
}

type props = {
  handleBack?: () => void
  title: string
}
export default function CustomHeader({ handleBack, title }: props) {
  const mode = useColorScheme()
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.container, {
      marginTop: insets.top
    }]}>
      {handleBack &&
        <CustomImageButton
        size={25}
        flat
        src={getIconImage("back", mode === "light")} 
        handleClick={handleBack}
        type="text"
        />
      }
      {!handleBack &&
        <CustomFloatingSquare isFlat />
      }
      <CustomLabel adaptToTheme textAlign="center" bold labelText={title} />
      <CustomFloatingSquare isFlat />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
  },
})