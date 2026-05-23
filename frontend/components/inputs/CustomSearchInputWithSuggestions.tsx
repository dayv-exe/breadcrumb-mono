import { useThemeColor } from "@/hooks/useThemeColor";
import React, { useRef, useState } from "react";
import {
  StyleSheet,
  TextStyle,
  View,
  ViewStyle
} from "react-native";
import { ElevatedSectionedScrollView, Section } from "../views/ElevatedSectionedScrollView";
import CustomSearchInput from "./CustomSearchInput";
import { searchInputProps } from "./searchInputProps";

// ---------- Props ----------
type Props = searchInputProps & {
  value: string;
  handleChange: (s: string) => void;
  handleOnFocus?: () => void;
  handleOnBlur?: () => void;
  placeholder?: string;
  borderRadius?: number;
  imageSize?: number;
  useRedBorders?: boolean;
  customStyle?: ViewStyle | ViewStyle[];
  customInputStyle?: TextStyle | TextStyle[];
  solidAppearance?: boolean;

  // suggestion-specific
  sections: Section[];
  /**
   * Whether the dropdown should be shown. If omitted, the dropdown is shown
   * automatically while the input is focused and there is at least one
   * non-hidden section with data.
   */
  showSuggestions?: boolean;
  maxHeight?: number;
  emptyMessage?: string;
  /**
   * If true, the dropdown renders in a Modal overlay positioned beneath the
   * input. Useful when the input lives inside a parent with `overflow: hidden`
   * (e.g. a header). Defaults to false — the dropdown is rendered inline,
   * absolutely positioned beneath the input.
   */
  useOverlay?: boolean;
};

export default function CustomSearchInputWithSuggestions({
  sections,
  showSuggestions,
  maxHeight = 300,
  emptyMessage,
  useOverlay = false,
  handleOnFocus,
  handleOnBlur,
  handleChange,
  ref,
  value,
  borderRadius,
  customInputStyle,
  customStyle,
  imageSize,
  placeholder,
  solidAppearance,
  useRedBorders
}: Props) {
  const inputRef = ref;
  const containerRef = useRef<View>(null);

  const [isFocused, setIsFocused] = useState(false);

  const fadedBg = useThemeColor({}, "fadedBackground");
  const bgCol = useThemeColor({}, "background");

  const visibleSections = sections.filter((s) => !s.hidden);
  const hasAnyData = visibleSections.some((s) => s.data.length > 0);

  const shouldShow =
    showSuggestions !== undefined
      ? showSuggestions
      : isFocused && (hasAnyData || !!emptyMessage);

  const onFocus = () => {
    handleOnFocus?.();
  };

  const onBlur = () => {
    setIsFocused(false);
    handleOnBlur?.();
  };

  const dropdown = (
    <View
      style={[
        styles.dropdown,
        {
          backgroundColor: solidAppearance ? bgCol : fadedBg,
          borderRadius: borderRadius ?? 15,
          maxHeight,
        },
      ]}
    >
      <ElevatedSectionedScrollView sections={visibleSections} />
    </View>
  );

  return (
    <View ref={containerRef} style={styles.root}>
      <CustomSearchInput
        handleChange={handleChange}
        value={value}
        borderRadius={borderRadius}
        customInputStyle={customInputStyle}
        customStyle={customStyle}
        imageSize={imageSize}
        placeholder={placeholder}
        solidAppearance={solidAppearance}
        useRedBorders={useRedBorders}
        ref={inputRef}
        handleOnFocus={onFocus}
        handleOnBlur={onBlur}
      />

      {shouldShow && !useOverlay && (
        <View style={styles.inlineDropdownWrapper} pointerEvents="box-none">
          {dropdown}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexGrow: 1,
    flexShrink: 1,
    position: "relative",
    zIndex: 1000,
  },
  inlineDropdownWrapper: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: 6,
    zIndex: 1001,
  },
  dropdown: {
    width: "100%",
    overflow: "hidden",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    paddingVertical: 6,
  },
  section: {
    paddingVertical: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 15,
    paddingVertical: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  itemWrapper: {
    width: "100%",
  },
  emptyContainer: {
    padding: 15,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
  },
});