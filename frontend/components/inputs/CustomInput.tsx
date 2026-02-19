import { Colors } from "@/constants/Colors";
import { inputMode } from "@/constants/customInputModeTypes";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Ref, useState } from "react";
import { DimensionValue, Image, KeyboardTypeOptions, StyleProp, StyleSheet, Text, TextInput, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native";
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
  placeholder?: string
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
  multiline?: boolean
  allowNewLines?: boolean
  customStyle?: StyleProp<ViewStyle>
  customInputStyle?: StyleProp<TextStyle>
  hideActiveBorders?: boolean
  enabled?: boolean
  onFocus?: () => void
  onBlur?: () => void
  onSubmitEditing?: () => void
}

export default function CustomInput({ value, setValue, labelText = "Label:", infoText = "", showInfoTextOnFocus = false, isPassword = false, disableAutoCorrect = false, autoCapitalize, inputMode = "normal", showInfoTextAlways = false, keyboardType = "default", width = "100%", forceLowercase = false, adaptToTheme = false, handleForgotPassword, ref, useLessProminentColors = true, multiline = false, allowNewLines = true, customStyle, customInputStyle, hideActiveBorders, onFocus, onBlur, onSubmitEditing, placeholder }: iProps) {
  const [focused, setFocused] = useState(false)
  const [hidePassword, setHidePassword] = useState(true)

  const handleFocus = () => setFocused(true)
  const handleBlur = () => setFocused(false)
  const textColor = useThemeColor({}, "text")
  const fadedBackgroundColor = useThemeColor({}, "fadedBackground")

  if (keyboardType === "email-address") disableAutoCorrect = true

  const handleChangeText = (e: string) => {
    if (!setValue) return
    let text = forceLowercase ? e.toLowerCase() : e
    if (multiline && !allowNewLines) text = text.replace(/\n/g, "")
    setValue(text)
  }

  return (
    <>
      {labelText && <Text style={[
        styles.labelText,
        {
          color: adaptToTheme ? textColor : "#fff"
        }
      ]}>
        {labelText}
      </Text>}
      <View style={[styles.inputContainer, customStyle]}>
        <TextInput
          ref={ref}
          placeholder={placeholder}
          onSubmitEditing={onSubmitEditing}
          multiline={multiline}
          numberOfLines={multiline && allowNewLines ? 2 : undefined}
          scrollEnabled={multiline && allowNewLines}
          keyboardType={isPassword && !hidePassword ? "visible-password" : keyboardType}
          autoCorrect={!disableAutoCorrect}
          autoCapitalize={forceLowercase ? "none" : autoCapitalize}
          readOnly={setValue == null}
          secureTextEntry={isPassword && hidePassword}
          onFocus={() => {
            handleFocus()
            if (onFocus) {
              onFocus()
            }
          }}
          onBlur={() => {
            handleBlur()
            if (onBlur) {
              onBlur()
            }
          }}
          submitBehavior="blurAndSubmit"
          returnKeyType={multiline && !allowNewLines ? "done" : undefined}
          style={[
            styles.input,
            {
              borderColor: hideActiveBorders ? "transparent" : inputMode === "normal" ? focused ? (!useLessProminentColors ? Colors.light.vibrantButton : Colors.light.vibrantBackground) : "transparent" :
                inputMode === "warn" ? "red" :
                  "green",
              backgroundColor: adaptToTheme ? fadedBackgroundColor : Colors.dark.fadedBackground,
              color: adaptToTheme ? textColor : Colors.light.text,
            },
            customInputStyle
          ]}
          value={value}
          onChangeText={handleChangeText}
        />

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
          <CustomButton squashed labelText="forgot password?" type="theme-faded" handleClick={handleForgotPassword} />
        </View>
      }

      {infoText && <Text style={[
        styles.infoText,
        {
          color: adaptToTheme ? textColor : Colors.dark.text
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
        <View style={{ width: "100%" }}>
          <CustomEmailSuggestion useTheme={adaptToTheme} inputVal={value} setInputVal={setValue} />
        </View>
      }
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    width: "auto",
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