import { Colors } from "@/constants/Colors";
import { inputMode } from "@/constants/customInputModeTypes";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Ref, useState } from "react";
import { DimensionValue, Image, KeyboardTypeOptions, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import CustomButton from "../buttons/CustomButton";
import CustomEmailSuggestion from "../buttons/CustomEmailSuggestion";
import Spacer from "../Spacer";

type autoCapitalizeType = "none" | "sentences" | "words" | "characters"

type iProps = {
  labelText?: string
  value: string
  setValue?: (e: string) => void
  width?: DimensionValue
  infoText?: string
  forceLowercase?: boolean
  showInfoTextOnFocus?: boolean
  showInfoTextAlways?: boolean
  handleForgotPassword?: () => void
  isPassword?: boolean
  disableAutoCorrect?: boolean
  autoCapitalize?: autoCapitalizeType
  inputMode?: inputMode
  keyboardType?: KeyboardTypeOptions
  adaptToTheme?: boolean
  useLessProminentColors?: boolean
  ref?: Ref<TextInput>
}

export default function CustomInput({ value, setValue, labelText = "Label:", infoText = "", showInfoTextOnFocus = false, isPassword = false, disableAutoCorrect = false, autoCapitalize, inputMode = "normal", showInfoTextAlways = false, keyboardType = "default", width = "100%", forceLowercase = false, adaptToTheme = false, handleForgotPassword, ref, useLessProminentColors }: iProps) {
  const [focused, setFocused] = useState(false)
  const [hidePassword, setHidePassword] = useState(true)

  const handleFocus = () => setFocused(true)
  const handleBlur = () => setFocused(false)
  const textColor = useThemeColor({}, "text")
  const fadedBackgroundColor = useThemeColor({}, "fadedBackground")

  if (keyboardType === "email-address") disableAutoCorrect = true

  return (
    <View style={[
      styles.container,
      { width: width }
    ]}>
      <Text style={[
        styles.labelText,
        {
          color: adaptToTheme ? textColor : "#fff"
        }
      ]}>
        {labelText}
      </Text>
      <View style={styles.inputContainer}>
        <TextInput ref={ref} keyboardType={isPassword && !hidePassword ? "visible-password" : keyboardType} autoCorrect={!disableAutoCorrect} autoCapitalize={forceLowercase ? "none" : autoCapitalize} readOnly={setValue == null} secureTextEntry={isPassword && hidePassword} onFocus={handleFocus} onBlur={handleBlur} style={[
          styles.input,
          {
            borderColor: inputMode === "normal" ? focused ? (!useLessProminentColors ? Colors.light.vibrantButton : Colors.light.vibrantBackground) : "transparent" :
              inputMode === "warn" ? "red" :
                "green",

            backgroundColor: adaptToTheme ? fadedBackgroundColor: Colors.dark.fadedBackground,

            color: textColor
          }
        ]}
          value={value}
          onChangeText={setValue ? e => setValue(forceLowercase ? e.toLowerCase() : e) : e => { }} />

        {isPassword && <TouchableOpacity style={styles.showToggle} onPress={() => { setHidePassword(hidePassword ? false : true) }}>
          {<Image style={styles.inputToggle} source={
            hidePassword ? require("../../assets/images/hidepassword.png") :
              require("../../assets/images/showpassword.png")
          } />}
        </TouchableOpacity>}
      </View>

      {
        handleForgotPassword &&
        <View style={{ alignSelf: "flex-start", flexDirection: "column" }}>
          <Spacer size="small" />
          <CustomButton squashed labelText="forgot password?" type="faded" handleClick={handleForgotPassword} />
        </View>
      }

      {infoText && <Text style={[
        styles.infoText,
        {
          color: adaptToTheme && inputMode !== "warn" ? textColor : inputMode === "normal" ? textColor :
            inputMode === "warn" ? textColor :
              textColor,
        }
      ]}>
        {
          showInfoTextAlways ? infoText :
            showInfoTextOnFocus && focused ? infoText :
              !showInfoTextOnFocus && !focused ? infoText :
                ""
        }
      </Text>}
      {(keyboardType === "email-address") &&
          <View style={{width: "100%"}}>
            <CustomEmailSuggestion inputVal={value} setInputVal={setValue} />
          </View>
        }
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center"
  },
  inputContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center"
  },
  input: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, .2)",
    padding: 15,
    borderRadius: 15,
    borderWidth: 2,
    fontSize: 17,
    fontWeight: "500"
  },
  labelText: {
    width: "100%",
    padding: 5,
    fontWeight: "600",
    fontSize: 16,
  },
  infoText: {
    width: "100%",
    color: "#fff",
    padding: 5,
  },
  showToggle: {
    position: "absolute",
    right: 15,
    padding: 5,
    borderRadius: 5
  },
  inputToggle: {
    height: 20,
    width: 20,
    opacity: .7
  }
})