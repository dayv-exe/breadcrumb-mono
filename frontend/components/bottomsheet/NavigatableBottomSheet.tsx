import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { BottomSheetMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { NavigationContainer, NavigationIndependentTree } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { ColorValue, StyleSheet } from "react-native";
import { BottomSheetOptions } from "./BottomSheetContext";

type Screen = {
  name: string;
  component: React.ComponentType<any>;
};

type Props = {
  bottomSheetRef: React.RefObject<BottomSheetMethods | null>;
  snapPoints?: (string | number)[];
  renderBackdrop?: (props: any) => React.JSX.Element;
  handleBgCol: ColorValue;
  sheetBgCol: ColorValue;
  sheetOpen: boolean;
  handleSheetClose: () => void;
  sheetOptions: BottomSheetOptions;
  screens: Screen[];
  initialScreen?: string;
};

const Stack = createNativeStackNavigator();

export default function NavigatableBottomSheet({
  bottomSheetRef,
  snapPoints,
  handleBgCol,
  sheetBgCol,
  sheetOptions,
  sheetOpen,
  renderBackdrop,
  handleSheetClose,
  screens,
  initialScreen,
}: Props) {
  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enableDynamicSizing={sheetOptions.dynamicHeight}
      enableOverDrag={sheetOptions.allowDrag ?? true}
      enableContentPanningGesture={false}
      enableHandlePanningGesture={sheetOptions.allowDrag ?? true}
      handleIndicatorStyle={{ backgroundColor: handleBgCol }}
      handleComponent={sheetOptions.showHandle ? undefined : null}
      enablePanDownToClose={sheetOptions.allowDrag ?? true}
      backdropComponent={
        sheetOptions.showOverlay !== false ? renderBackdrop : undefined
      }
      backgroundStyle={[
        sheetOptions.backgroundStyle,
        { backgroundColor: sheetBgCol },
        sheetOptions.showOverlay ? styles.sheet : styles.sheetWithShadow,
      ]}
      animationConfigs={
        !sheetOptions.reduceAnimations
          ? { stiffness: 500, damping: 20, mass: 0.5 }
          : { stiffness: 500, damping: 120, mass: 0.5 }
      }
      onClose={handleSheetClose}
    >
      <BottomSheetView style={styles.contentContainer}>
        {sheetOpen && (
          <NavigationIndependentTree>
            <NavigationContainer>
              <Stack.Navigator
                initialRouteName={initialScreen ?? screens[0]?.name}
                screenOptions={{ headerShown: false }}
              >
                {screens.map((screen) => (
                  <Stack.Screen
                    key={screen.name}
                    name={screen.name}
                    component={screen.component}
                  />
                ))}
              </Stack.Navigator>
            </NavigationContainer>
          </NavigationIndependentTree>
        )}
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
  },
  sheetWithShadow: {
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    shadowRadius: 10,
    shadowOpacity: 0.15,
    elevation: 5,
  },
});