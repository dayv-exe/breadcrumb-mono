import React, { Children, ReactNode, useEffect, useRef } from 'react';
import { Dimensions, ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = 80;
const ITEM_SPACING = (SCREEN_WIDTH - ITEM_WIDTH) / 2;

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

type SnapCarouselProps = {
  children: ReactNode;
  selectedIndex: number;
  onSelect: (index: number) => void;
  itemWidth?: number;
  style?: StyleProp<ViewStyle>;
};

export default function SnapCarousel({
  children,
  selectedIndex,
  onSelect,
  itemWidth = ITEM_WIDTH,
  style,
}: SnapCarouselProps) {
  const scrollX = useSharedValue(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const itemSpacing = (SCREEN_WIDTH - itemWidth) / 2;
  const childArray = Children.toArray(children);

  useEffect(() => {
    scrollViewRef.current?.scrollTo({
      x: selectedIndex * itemWidth,
      animated: true,
    });
  }, [selectedIndex, itemWidth]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const onScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / itemWidth);
    const clampedIndex = Math.max(0, Math.min(index, childArray.length - 1));
    onSelect(clampedIndex);
  };

  return (
    <View style={[styles.container, style]}>
      <AnimatedScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: itemSpacing }}
        snapToInterval={itemWidth}
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
            itemWidth={itemWidth}
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
  itemWidth: number;
};

function CarouselItem({ children, index, scrollX, itemWidth }: CarouselItemProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * itemWidth,
      index * itemWidth,
      (index + 1) * itemWidth,
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
      [0.75, 1, 0.75],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <View style={[styles.itemContainer, { width: itemWidth }]}>
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