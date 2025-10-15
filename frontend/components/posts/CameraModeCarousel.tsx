import React, { useRef } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
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

export type CameraMode = 'Photo' | 'Video' | 'Portrait' | 'Night' | 'Slo-Mo' | 'Time-Lapse';

type CameraModeCarouselProps = {
  modes: CameraMode[];
  selectedMode: CameraMode;
  onModeChange: (mode: CameraMode) => void;
};

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export default function CameraModeCarousel({
  modes,
  selectedMode,
  onModeChange,
}: CameraModeCarouselProps) {
  const scrollX = useSharedValue(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const onScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / ITEM_WIDTH);
    const clampedIndex = Math.max(0, Math.min(index, modes.length - 1));
    
    onModeChange(modes[clampedIndex]);
  };

  return (
    <View style={styles.container}>
      <AnimatedScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: ITEM_SPACING,
        }}
        snapToInterval={ITEM_WIDTH}
        decelerationRate="fast"
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onScrollEnd}
      >
        {modes.map((mode, index) => (
          <ModeItem
            key={mode}
            mode={mode}
            index={index}
            scrollX={scrollX}
          />
        ))}
      </AnimatedScrollView>
    </View>
  );
}

type ModeItemProps = {
  mode: CameraMode;
  index: number;
  scrollX: SharedValue<number>;
};

function ModeItem({ mode, index, scrollX }: ModeItemProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * ITEM_WIDTH,
      index * ITEM_WIDTH,
      (index + 1) * ITEM_WIDTH,
    ];

    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.7, 1, 0.7],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.4, 1, 0.4],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <Animated.View style={[styles.modeItem, animatedStyle]}>
      <Text style={styles.modeText}>{mode}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 40,
  },
  modeItem: {
    width: ITEM_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});