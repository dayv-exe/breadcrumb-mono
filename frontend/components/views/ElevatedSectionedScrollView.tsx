import { useThemeColor } from "@/hooks/use-theme-color";
import React, { useCallback, useRef } from "react";
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  View
} from "react-native";
import ElevatedSection from "./ElevatedSection";

// --- Types ---

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

export type Section<T = any> = StaticSection<T> | PaginatedSection<T>;

interface ElevatedSectionedScrollViewProps extends Omit<ScrollViewProps, "onScroll"> {
  sections: Section[];
  /** Distance from bottom (px) to trigger loading more. Default 200 */
  scrollThreshold?: number;
  sectionTitleStyle?: object;
}

// --- Component ---

export function ElevatedSectionedScrollView({
  sections,
  scrollThreshold = 200,
  sectionTitleStyle,
  ...scrollViewProps
}: ElevatedSectionedScrollViewProps) {
  const loadingRef = useRef(false);

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
  const fadedBg = useThemeColor({}, "fadedBackground")

  return (
    <ScrollView
      onScroll={handleScroll}
      scrollEventThrottle={16}
      {...scrollViewProps}
    >
      {visibleSections.map((section) => (
        <View key={section.key} style={styles.section}>
          <ElevatedSection title={section.title ?? ""}>
            {section.data.map((item, index) => (
              <React.Fragment key={section.keyExtractor(item)}>
                {section.renderItem(item, index)}
                {index + 1 < section.data.length && <View style={{ borderBottomWidth: 1, borderBottomColor: fadedBg }} />}
              </React.Fragment>
            ))}

            {section.type === "paginated" && section.isFetchingMore && (
              <ActivityIndicator style={styles.loader} />
            )}
          </ElevatedSection>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  section: {
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  loader: {
    paddingVertical: 12,
  },
});