import { useColorScheme } from "@/hooks/useColorScheme.web";
import { useThemeColor } from "@/hooks/useThemeColor";
import { CircleXIcon, SearchIcon, XIcon } from "lucide-react-native";
import React from "react";
import { StyleSheet, TextInput, View } from "react-native";
import CustomFloatingSquare from "../buttons/CustomFloatingSquare";
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
      <SearchIcon size={imageSize} stroke={textCol} strokeWidth={2.5} />
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
        {value && value.length > 0 &&
          <>
            <CustomFloatingSquare isFlat handleClick={() => {
              handleChange("")
              ref.current?.focus()
            }}>
              <CircleXIcon size={20} stroke={textCol} fill={textCol} />
              <XIcon size={11} stroke={bgCol} strokeWidth={4} style={{
                position: "absolute",
                alignSelf: "center"
              }} />
            </CustomFloatingSquare>
          </>
        }
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