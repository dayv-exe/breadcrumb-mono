import { BottomSheetView } from "@gorhom/bottom-sheet";
import {
  NavigationContainer,
  NavigationIndependentTree,
  ParamListBase,
  useNavigationContainerRef,
} from "@react-navigation/native";
import {
  createStackNavigator,
  StackNavigationOptions
} from "@react-navigation/stack";
import { useEffect, useMemo } from "react";
import { BackHandler } from "react-native";

type SheetScreen<ParamList extends ParamListBase> = {
  [K in Extract<keyof ParamList, string>]: {
    name: K;
    component: React.ComponentType<any>;
    initialParams?: Partial<ParamList[K]>;
    options?: StackNavigationOptions;
  };
}[Extract<keyof ParamList, string>];

type Props<ParamList extends ParamListBase> = {
  screens: SheetScreen<ParamList>[];
  initialRouteName: Extract<keyof ParamList, string>;
  height: number;
  screenOptions?: StackNavigationOptions;
};

export default function NavigatableBottomSheetView
  <ParamList extends ParamListBase
  >({ screens, initialRouteName, height, screenOptions }: Props<ParamList>) {
  const Stack = useMemo(() => createStackNavigator(), []);
  const navigationRef = useNavigationContainerRef<ParamList>();

  // independent trees don't inherit the parent's back handling
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (navigationRef.isReady() && navigationRef.canGoBack()) {
        navigationRef.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [navigationRef]);

  return (
    <BottomSheetView style={{ width: "100%", height, overflow: "hidden" }}>
      <NavigationIndependentTree>
        <NavigationContainer ref={navigationRef}>
          <Stack.Navigator
            initialRouteName={initialRouteName}
            screenOptions={{
              headerShown: false,
              //...TransitionPresets.SlideFromRightIOS,
              gestureEnabled: true,
              cardStyle: { backgroundColor: "transparent" },
              detachPreviousScreen: false,
              ...screenOptions,
            }}
          >
            {screens.map(s => (
              <Stack.Screen
                key={s.name}
                name={s.name}
                component={s.component}
                options={s.options}
                initialParams={s.initialParams}
              />
            ))}
          </Stack.Navigator>
        </NavigationContainer>
      </NavigationIndependentTree>
    </BottomSheetView>
  );
}