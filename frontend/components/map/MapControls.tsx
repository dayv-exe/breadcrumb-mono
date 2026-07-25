import { Colors } from "@/constants/Colors";
import { useReverseGeocode } from "@/hooks/useReverseGeocode";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useLocationStore } from "@/utils/useLocationStore";
import { useRouter } from "expo-router";
import { ChevronDownIcon, LocateIcon, PlusIcon, SatelliteIcon } from "lucide-react-native";
import { useEffect } from "react";
import { Dimensions, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import Reanimated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomSheet } from "../bottomsheet/BottomSheetContext";
import CustomButton from "../buttons/CustomButton";
import CameraView from "../camera/CameraView";
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

function CameraComponent() {

}

export default function MapControls({ containerStyle, backgroundStyle, onFocusPress, onSatellitePress, pitchToggleVisible, onPitchToggle, useSatellite }: props) {
  const bgCol = useThemeColor({}, "background")
  const textCol = useThemeColor({}, "text")
  const fadedBgCol = useThemeColor({}, "fadedBackground")
  const { openSheet, closeSheet } = useBottomSheet()
  const screenHeight = Dimensions.get("window").height
  const nav = useRouter()
  const insets = useSafeAreaInsets()
  const { address, setReverseGeocodeCoordinates } = useReverseGeocode()
  const camBgCol = "black"
  const camTextCol = Colors.dark.text

  useEffect(() => {
    const coords = useLocationStore.getState().coordinates
    setReverseGeocodeCoordinates(coords)
  }, [])

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
          openSheet({
            backgroundStyle: {
              backgroundColor: camBgCol,
            },
            content: (
              <View
                style={{
                  height: screenHeight,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View
                  style={{
                    position: "absolute",
                    top: insets.top,
                    paddingHorizontal: 20,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "column",
                      alignItems: "flex-start",
                      justifyContent: "center",
                      flexGrow: 1,
                      flexShrink: 1,
                    }}
                  >
                    <CustomLabel labelText="New" allowTruncate fontSize={25} bold padding={0} />
                    {address && <CustomLabel labelText={address.split(",")[0]} allowTruncate fontSize={13} fade padding={0}
                      customStyle={{
                        textAlign: "left",
                        maxWidth: "45%",
                      }}
                    />}
                  </View>
                  <CustomButton
                    freed
                    type="text"
                    paddingHorizontal={0}

                  >
                    <ChevronDownIcon stroke={camTextCol} strokeWidth={3} size={30} />
                  </CustomButton>
                </View>
                <View
                  style={{

                  }}
                >
                  <CameraView />
                </View>
              </View>
            ),
            showHandle: false,
            reduceAnimations: true,
            fullExpansionOnOpen: true,
            snapPoints: [screenHeight],
          })
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