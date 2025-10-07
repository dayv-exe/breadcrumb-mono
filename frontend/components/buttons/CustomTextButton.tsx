import { useThemeColor } from "@/hooks/useThemeColor";
import { StyleSheet, Text } from "react-native";
import CustomFloatingSquare from "./CustomFloatingSquare";

type props = {
  text: string
  allowWidthExpansion?: boolean
}

export default function CustomTextButton({ text, allowWidthExpansion=false }: props) {
  const theme = useThemeColor

  return (
    <CustomFloatingSquare allowWidthExpansion={allowWidthExpansion}>
      <Text style={[
        styles.text,
        {
          color: theme({}, "text"),
        }
      ]}>{text}</Text>
    </CustomFloatingSquare>
  )
}

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
  }
})