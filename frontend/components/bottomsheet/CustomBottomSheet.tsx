import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { BottomSheetMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import React from "react";
import { ColorValue, StyleSheet } from "react-native";
import { BottomSheetOptions } from "./BottomSheetContext";

type props = {
  bottomSheetRef: React.RefObject<BottomSheetMethods | null>
  snapPoints?: (string | number)[] | undefined
  renderBackdrop?: (props: any) => React.JSX.Element
  handleBgCol: ColorValue
  sheetBgCol: ColorValue
  sheetOpen: boolean
  handleSheetClose: () => void
  sheetOptions: BottomSheetOptions
}

export default function CustomBottomSheet({bottomSheetRef, snapPoints, handleBgCol, sheetBgCol, sheetOptions, sheetOpen, renderBackdrop, handleSheetClose}: props) {
  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enableDynamicSizing={sheetOptions.dynamicHeight}
      enableOverDrag={sheetOptions.allowDrag ?? true}
      enableContentPanningGesture={sheetOptions.allowDrag ?? true}
      enableHandlePanningGesture={sheetOptions.allowDrag ?? true}
      handleIndicatorStyle={{ backgroundColor: handleBgCol }}
      handleComponent={sheetOptions.showHandle ? undefined : null}
      enablePanDownToClose={sheetOptions.allowDrag ?? true}
      backdropComponent={sheetOptions.showOverlay !== false ? renderBackdrop : undefined}
      backgroundStyle={[sheetOptions.backgroundStyle, { backgroundColor: sheetBgCol }, sheetOptions.showOverlay ? styles.sheet : styles.sheetWithShadow]}
      animationConfigs={!sheetOptions.reduceAnimations ? {
        stiffness: 500,
        damping: 20,
        mass: 0.5,
      } : {
        stiffness: 500,
        damping: 120,
        mass: 0.5,
      }}
      onClose={handleSheetClose}
    >
      <BottomSheetView>
        {sheetOpen && sheetOptions.content}
      </BottomSheetView>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
  },
  sheetWithShadow: {
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    shadowRadius: 10,
    shadowOpacity: .15,
    elevation: 5,
  }
})