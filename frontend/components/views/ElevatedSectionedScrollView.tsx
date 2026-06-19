import { useThemeColor } from "@/hooks/useThemeColor";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  View
} from "react-native";
import CustomLabel from "../CustomLabel";
import ElevatedSection from "./ElevatedSection";

// --- Types ---

interface RawComponentSection {
  key: string;
  title?: string;
  type: "raw";
  component: React.JSX.Element;
  hidden?: boolean;
  useElevation?: boolean
}

interface StaticSection<T> {
  key: string;
  title?: string;
  type: "static";
  data: T[];
  keyExtractor: (item: T) => string;
  renderItem: (item: T, index: number) => React.ReactNode;
  hidden?: boolean;
}

interface PaginatedSection<T> {
  key: string;
  title?: string;
  type: "paginated";
  data: T[];
  keyExtractor: (item: T) => string;
  renderItem: (item: T, index: number) => React.ReactNode;
  hidden?: boolean;
  onEndReached: () => void;
  isFetchingMore: boolean;
  hasMore: boolean;
}

export type Section<T = any> = StaticSection<T> | PaginatedSection<T> | RawComponentSection;

interface ElevatedSectionedScrollViewProps extends Omit<ScrollViewProps, "onScroll"> {
  sections: Section[];
  /** Distance from bottom (px) to trigger loading more. Default 200 */
  scrollThreshold?: number;
  sectionTitleStyle?: object;
  /** Called on pull-to-refresh. Should return a Promise that resolves when refresh is done. */
  hideSectionTitles?: boolean
  onRefresh?: () => Promise<void>;
}

// --- Component ---

export function ElevatedSectionedScrollView({
  sections,
  scrollThreshold = 200,
  sectionTitleStyle,
  onRefresh,
  hideSectionTitles,
  ...scrollViewProps
}: ElevatedSectionedScrollViewProps) {
  const [refreshing, setRefreshing] = useState(false);

  const fadedBg = useThemeColor({}, "fadedBackgroundElevated");
  const darkBg = useThemeColor({}, "darkBackground")
  const textCol = useThemeColor({}, "text")

  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
      const distanceFromBottom =
        contentSize.height - layoutMeasurement.height - contentOffset.y;

      if (distanceFromBottom < scrollThreshold) {
        const paginatedSections = sections.filter(
          (s): s is PaginatedSection<any> =>
            s.type === "paginated" && !s.hidden && s.hasMore && !s.isFetchingMore
        );

        const target = paginatedSections[paginatedSections.length - 1];
        if (target) {
          target.onEndReached();
        }
      }
    },
    [sections, scrollThreshold]
  );

  const visibleSections = sections.filter((s) => !s.hidden);

  // Build flat list of direct children + track which indices are sticky headers
  const children: React.ReactNode[] = [];
  const stickyIndices: number[] = [];

  visibleSections.forEach((section, sectionIdx) => {
    const isLast = sectionIdx === visibleSections.length - 1;

    // Sticky header (direct child of ScrollView)
    if (1 !== 1 && section.title && !hideSectionTitles) {
      stickyIndices.push(children.length);
      children.push(
        <View
          key={`${section.key}-header`}
          style={[styles.stickyHeader, { backgroundColor: darkBg, paddingHorizontal: 15 }]}
        >
          <CustomLabel adaptToTheme bold labelText={section.title} fontSize={14} customStyle={[sectionTitleStyle, { backgroundColor: darkBg, padding: 0 }]} />
        </View>
      );
    }

    // Section body
    if (section.type !== "raw") {
      children.push(
        <View
          key={`${section.key}-body`}
          style={{ marginTop: 0, marginBottom: isLast ? 100 : 0, paddingHorizontal: 15, }}
        >
          <ElevatedSection title={section.title ?? ""}>
            {section.data.map((item, i) => (
              <React.Fragment key={section.keyExtractor(item)}>
                {section.renderItem(item, i)}
                {i + 1 < section.data.length && (
                  <View
                    style={{ borderBottomWidth: 1, borderBottomColor: fadedBg }}
                  />
                )}
              </React.Fragment>
            ))}

            {section.type === "paginated" && section.isFetchingMore && (
              <ActivityIndicator style={styles.loader} />
            )}
          </ElevatedSection>
        </View>
      );
    }

    if (section.type === "raw") {
      children.push(
        <View
          key={`${section.key}-body`}
          style={{ marginTop: 0, marginBottom: isLast ? 100 : 0, paddingHorizontal: 15, }}
        >
          {section.useElevation && <ElevatedSection title={section.title ?? ""}>
            {section.component}
          </ElevatedSection>}
          {!section.useElevation && <>
            {section.component}
          </>}
        </View>
      );
    }
  });

  return (
    <ScrollView
      onScroll={handleScroll}
      scrollEventThrottle={16}
      stickyHeaderIndices={stickyIndices}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        ) : undefined
      }
      showsVerticalScrollIndicator={false}
      {...scrollViewProps}
      keyboardShouldPersistTaps={"handled"}
      keyboardDismissMode="on-drag"
      onTouchStart={Keyboard.dismiss}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  stickyHeader: {
    paddingBottom: 0,
  },
  loader: {
    paddingVertical: 12,
  },
});