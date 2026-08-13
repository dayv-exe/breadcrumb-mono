import { Colors } from "@/constants/Colors";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useRouter } from "expo-router";
import { LocateIcon, PlusIcon, SatelliteIcon } from "lucide-react-native";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import Reanimated from "react-native-reanimated";
import CustomButton from "../buttons/CustomButton";
import CustomLabel from "../CustomLabel";
import Spacer from "../Spacer";

interface props {
  useSatellite: boolean
  containerStyle?: StyleProp<ViewStyle>
  backgroundStyle?: StyleProp<ViewStyle>
  pitchToggleVisible: boolean
  onSatellitePress: () => void
  onFocusPress: () => void
  onPitchToggle: () => void
}

export default function MapControls({ containerStyle, backgroundStyle, onFocusPress, onSatellitePress, pitchToggleVisible, onPitchToggle, useSatellite }: props) {
  const bgCol = useThemeColor({}, "background")
  const textCol = useThemeColor({}, "text")
  const fadedBgCol = useThemeColor({}, "fadedBackground")
  const nav = useRouter()

  const SIZE = 25

  return (
    <Reanimated.View
      pointerEvents="box-none"
      style={[styles.container, {
      }, containerStyle]}
    >
      {pitchToggleVisible && <>
        <CustomButton
          freed
          type="themed"
          customStyle={[styles.shadow, {
            width: 50,
            height: 50,
          }]}
          handleClick={onPitchToggle}
        >
          <CustomLabel
            adaptToTheme
            labelText="2D"
            padding={0}
            bold
            width="auto"
          />
        </CustomButton>
        <Spacer size="small" />
      </>}
      <View
        style={[styles.background, styles.shadow, {
          width: "auto",
          backgroundColor: bgCol,
        }, backgroundStyle]}
      >
        <CustomButton
          freed
          type="text"
          handleClick={onSatellitePress}
          customStyle={{
            width: 50,
            height: 45
          }}
        >
          <SatelliteIcon stroke={useSatellite ? Colors.light.vibrantBackground : textCol} strokeWidth={2.25} size={SIZE} />
        </CustomButton>
        <View style={{
          width: SIZE,
          height: 1.5,
          borderRadius: 1000,
          backgroundColor: fadedBgCol,
        }} />
        <CustomButton
          freed
          type="text"
          handleClick={onFocusPress}
          customStyle={{
            width: 50,
            height: 45,
          }}
        >
          <LocateIcon stroke={textCol} strokeWidth={2.25} size={SIZE} />
        </CustomButton>
      </View>

      <Spacer />

      <CustomButton
        freed
        type="less-prominent"
        customStyle={[styles.shadow, {
          zIndex: 5000,
          width: 55,
          height: 55,
          shadowOffset: { height: 1, width: 1 }
        }]}
        handleClick={() => {
          // onFocusPress()
          nav.push("/(protected)/(main)/camera")
        }}
      >
        <PlusIcon size={27} stroke={"#fff"} strokeWidth={2.5} />
      </CustomButton>
    </Reanimated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    bottom: 110,
    right: 10,
    zIndex: 1000,
  },

  background: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 1000,
    paddingVertical: 5,
  },

  shadow: {
    elevation: 10,
    shadowColor: "#000000",
    shadowOffset: { width: 7, height: 7 },
    shadowOpacity: .375,
    shadowRadius: 10,
  },
})