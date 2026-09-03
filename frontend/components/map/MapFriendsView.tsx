import { useThemeColor } from "@/hooks/useThemeColor";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { SharedValue, useAnimatedReaction } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import CrumbFeed from "../views/CrumbFeed";

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
      <CrumbFeed />
    </BottomSheetView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
})