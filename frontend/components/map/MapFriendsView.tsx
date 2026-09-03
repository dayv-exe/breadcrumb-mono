import { useThemeColor } from "@/hooks/useThemeColor";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { SearchIcon } from "lucide-react-native";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { SharedValue, useAnimatedReaction } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import CustomButton from "../buttons/CustomButton";
import CustomLabel from "../CustomLabel";

interface props {
  screenHeight: number
  sheetPosition: SharedValue<number>
  bottomSheetRef: React.RefObject<BottomSheet | null>
  onSearchPress: () => void
}

export default function MapFriendsView({ sheetPosition, screenHeight, onSearchPress, bottomSheetRef }: props) {
  const textCol = useThemeColor({}, "text")
  const [isOpened, setIsOpened] = useState(false)

  const handleToggleSheet = () => {
    if (!bottomSheetRef) return
    if (isOpened) bottomSheetRef.current?.collapse()
    else bottomSheetRef.current?.expand()
  }

  useAnimatedReaction(
    () => sheetPosition.value < screenHeight * .8, // true = sheet is high up
    (isSheetUp, previous) => {
      if (isSheetUp !== previous) {
        scheduleOnRN(setIsOpened, isSheetUp)
      }
    }
  );

  return (
    <BottomSheetView>
      <View
        style={[styles.container, {

        }]}
      >
        <View
          style={{
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 40,
            paddingHorizontal: 15,
          }}
        >
          <CustomLabel customStyle={{
            paddingVertical: 5,
          }} adaptToTheme fade textAlign="center" labelText="No crumbs near you" />
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            position: "absolute",
            right: 20,
            top: 0,
          }}
        >
          <CustomButton
            freed
            type="theme-faded"
            customStyle={{
              padding: 10
            }}
            handleClick={onSearchPress}
          >
            <SearchIcon color={textCol} strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} size={20} />
          </CustomButton>
          {/* <CustomFloatingSquare handleClick={handleToggleSheet} isFlat customStyle={{
            backgroundColor: "transparent",
            width: 30,
            height: 30
          }}>
            {isOpened && <ChevronDown color={textCol} strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} />}
            {!isOpened && <ChevronUp color={textCol} strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} />}
          </CustomFloatingSquare> */}
        </View>
      </View>
    </BottomSheetView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
})