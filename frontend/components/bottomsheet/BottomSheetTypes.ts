import { ParamListBase } from "@react-navigation/native";
import { StackNavigationOptions } from "@react-navigation/stack";
import { ReactNode } from "react";
import { AnimatableNumericValue, ViewStyle } from "react-native";

export type ScreenType<ParamList extends ParamListBase> = {
  name: Extract<keyof ParamList, string>;
  component: React.ComponentType<any>;
  options?: StackNavigationOptions;
}

export type ScreenName<ParamList extends ParamListBase> = Extract<keyof ParamList, string>

export type BottomSheetOptions = {
  content: ReactNode
  snapPoints?: (string | number)[]
  dynamicHeight?: boolean
  allowDrag?: boolean
  showOverlay?: boolean
  backgroundStyle?: ViewStyle
  tapOutsideDismiss?: boolean
  onSheetDismissed?: () => void
  showHandle?: boolean
  reduceAnimations?: boolean
  fullExpansionOnOpen?: boolean
  absoluteFill?: boolean
  borderRadius?: string | AnimatableNumericValue | undefined
  isScrollableContent?: boolean
  useRawComponent?: boolean
  onChange?: (position: number) => void
};