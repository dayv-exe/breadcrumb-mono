import { SUGGESTED_EMAIL_DOMAINS } from "@/constants/appConstants";
import { ScrollView, StyleSheet, View } from "react-native";
import Spacer from "../Spacer";
import CustomButton from "./CustomButton";

type props = {
  inputVal: string
  setInputVal?: (val: string) => void
  useTheme?: boolean
}

export default function CustomEmailSuggestion({ inputVal, setInputVal, useTheme = false }: props) {

  const getEmailName = () => {
    const parts = inputVal.split("@")
    return parts[0]
  }

  return (
    <>
    <Spacer size="small" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {
          SUGGESTED_EMAIL_DOMAINS.map(text => (
            <View style={{ flexDirection: "row" }} key={text}>
              <CustomButton
                squashed
                handleClick={setInputVal ? () => {
                  setInputVal(getEmailName() + text)
                } : () => { }}
                type={useTheme ? "theme-faded" : "faded"}
                labelText={text}
              />
              <Spacer size="small" />
            </View>
          ))
        }
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingHorizontal: 8,
  },
})
