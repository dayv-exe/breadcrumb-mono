import { useColorScheme } from "@/hooks/useColorScheme.web";
import { useThemeColor } from "@/hooks/useThemeColor";
import React from "react";
import { Image, StyleSheet, TextInput, View } from "react-native";
import CustomButton from "../buttons/CustomButton";
import { searchInputProps } from "./searchInputProps";

const icons = {
  search: {
    light: require("../../assets/images/icons/search_unsel_light.png"),
    dark: require("../../assets/images/icons/search_unsel_dark.png")
  },
  clear: {
    light: require("../../assets/images/icons/fillclose_sel_light.png"),
    dark: require("../../assets/images/icons/fillclose_sel_dark.png")
  }
}

export function getIconImage(name: keyof typeof icons, darkMode: boolean) {
  const theme = darkMode ? "dark" : "light"
  return icons[name][theme]
}

export default function CustomSearchInput({ value, handleChange, placeholder, borderRadius, imageSize = 18, ref, useRedBorders = false, handleOnFocus, handleOnBlur, customStyle, customInputStyle, solidAppearance }: searchInputProps) {
  const mode = useColorScheme()
  const fadedBg = useThemeColor({}, "fadedBackground")
  const bgCol = useThemeColor({}, "background")
  const textCol = useThemeColor({}, "text")

  return (
    <View style={[
      solidAppearance ? styles.solidContainer : styles.container, {
        backgroundColor: solidAppearance ? bgCol : fadedBg,
        borderRadius: borderRadius ?? 15,
        borderWidth: 2,
        borderColor: useRedBorders ? "red" : "transparent"
      }
      , customStyle]}>
      <Image
        source={getIconImage("search", mode === "light")}
        style={[{
          width: imageSize,
          height: imageSize,
        }]}
      />
      <TextInput ref={ref} style={[
        styles.input,
        {
          color: textCol,
        }
        , customInputStyle]}
        value={value}
        onChangeText={e => handleChange(e)}
        placeholder={placeholder}
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect={false}

        onFocus={() => {
          if (handleOnFocus) {
            handleOnFocus()
          }
        }}
        onBlur={() => {
          if (handleOnBlur) {
            handleOnBlur()
          }
        }}
      />

      <View style={styles.imageContainer}>
        {value && value.length > 0 && <CustomButton type="text" imgSrc={getIconImage("clear", mode === "light")} imgSize={19} labelText="" handleClick={() => {
          handleChange("")
          ref.current?.focus()
        }} />}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingLeft: 15,
    flexGrow: 1,
    flexShrink: 1,
  },
  input: {
    flexGrow: 1,
    flexShrink: 1,
    fontSize: 16,
    padding: 10,
    height: "auto"
  },
  imageContainer: {
    position: "absolute",
    right: 0,
  },

  solidContainer: {
    position: "relative",
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingLeft: 15,
    flexGrow: 1,
    flexShrink: 1,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: .25,
    shadowRadius: 10,
  },
})