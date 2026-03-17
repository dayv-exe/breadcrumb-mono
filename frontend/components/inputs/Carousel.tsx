import React, { Children, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, LayoutChangeEvent, ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

type SnapCarouselProps = {
  children: ReactNode;
  selectedIndex: number;
  onSelect: (index: number) => void;
  style?: StyleProp<ViewStyle>;
};

export default function SnapCarousel({
  children,
  selectedIndex,
  onSelect,
  style,
}: SnapCarouselProps) {
  const scrollX = useSharedValue(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const childArray = Children.toArray(children);

  // Store measured widths per index; null means not yet measured
  const [itemWidths, setItemWidths] = useState<(number | null)[]>(
    () => new Array(childArray.length).fill(null)
  );

  // Cumulative offsets derived from measured widths
  const offsets = useRef<number[]>([]);

  // Recompute offsets whenever widths change
  const allMeasured = itemWidths.every((w) => w !== null);
  if (allMeasured) {
    const widths = itemWidths as number[];
    const padding = (SCREEN_WIDTH - widths[0]) / 2;
    const result: number[] = [];
    let cumulative = 0;
    for (let i = 0; i < widths.length; i++) {
      result.push(cumulative);
      cumulative += widths[i];
    }
    offsets.current = result;
  }

  const handleItemLayout = useCallback((index: number, width: number) => {
    setItemWidths((prev) => {
      if (prev[index] === width) return prev;
      const next = [...prev];
      next[index] = width;
      return next;
    });
  }, []);

  useEffect(() => {
    if (!allMeasured) return;
    const targetX = offsets.current[selectedIndex] ?? 0;
    scrollViewRef.current?.scrollTo({ x: targetX, animated: true });
  }, [selectedIndex, allMeasured]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const onScrollEnd = (event: any) => {
    if (!allMeasured) return;
    const offsetX = event.nativeEvent.contentOffset.x;
    // Find the closest item by offset
    let closestIndex = 0;
    let closestDist = Infinity;
    for (let i = 0; i < offsets.current.length; i++) {
      const dist = Math.abs(offsets.current[i] - offsetX);
      if (dist < closestDist) {
        closestDist = dist;
        closestIndex = i;
      }
    }
    onSelect(closestIndex);
  };

  // Use first item's width for padding (fallback to 0)
  const firstWidth = (itemWidths[0] as number) ?? 0;
  const paddingHorizontal = allMeasured ? (SCREEN_WIDTH - firstWidth) / 2 : SCREEN_WIDTH / 2;

  // For snap, we use the average width as an approximation.
  // For uniform children this is exact; for varied widths it's close enough
  // that onScrollEnd's closest-item logic corrects any drift.
  const avgWidth = allMeasured
    ? (itemWidths as number[]).reduce((a, b) => a + b, 0) / itemWidths.length
    : undefined;

  return (
    <View style={[styles.container, style]}>
      <AnimatedScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal }}
        snapToInterval={avgWidth}
        decelerationRate="fast"
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onScrollEnd}
      >
        {childArray.map((child, index) => (
          <CarouselItem
            key={index}
            index={index}
            scrollX={scrollX}
            offsets={offsets}
            itemWidths={itemWidths as number[]}
            allMeasured={allMeasured}
            onItemLayout={handleItemLayout}
          >
            {child}
          </CarouselItem>
        ))}
      </AnimatedScrollView>
    </View>
  );
}

type CarouselItemProps = {
  children: ReactNode;
  index: number;
  scrollX: SharedValue<number>;
  offsets: React.MutableRefObject<number[]>;
  itemWidths: number[];
  allMeasured: boolean;
  onItemLayout: (index: number, width: number) => void;
};

function CarouselItem({
  children,
  index,
  scrollX,
  offsets,
  itemWidths,
  allMeasured,
  onItemLayout,
}: CarouselItemProps) {
  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      onItemLayout(index, e.nativeEvent.layout.width);
    },
    [index, onItemLayout]
  );

  const animatedStyle = useAnimatedStyle(() => {
    if (!allMeasured) {
      return { transform: [{ scale: 1 }], opacity: 1 };
    }

    const myOffset = offsets.current[index] ?? 0;
    const myWidth = itemWidths[index] ?? 1;

    const inputRange = [
      myOffset - myWidth,
      myOffset,
      myOffset + myWidth,
    ];

    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.7, 1.1, 0.7],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.5, 1, 0.5],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <View style={styles.itemContainer} onLayout={handleLayout}>
      <Animated.View style={[styles.item, animatedStyle]}>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  item: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});