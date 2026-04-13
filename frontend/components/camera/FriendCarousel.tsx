import { Friend, useMediaStore } from '@/utils/mediaStore';
import React, { useEffect, useRef } from 'react';
import { Dimensions, ScrollView, StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import CustomProfilePictureCircle from '../profile/CustomProfilePictureCircle';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = 80;
const ITEM_SPACING = (SCREEN_WIDTH - ITEM_WIDTH) / 2;

type FriendCarouselProps = {
  friends: Friend[];
  customStyle?: StyleProp<ViewStyle>;
};

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export default function FriendCarousel({
  friends,
  customStyle,
}: FriendCarouselProps) {
  const setSelectedFriend = useMediaStore((s) => s.setSelectedFriend);
  const selectedFriend = useMediaStore((s) => s.selectedFriend);
  const scrollX = useSharedValue(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const totalItems = friends.length + 1;

  // Scroll to the selected friend on mount or when selectedFriend changes
  useEffect(() => {
    const index = selectedFriend
      ? friends.findIndex((f) => f.id === selectedFriend.id) + 1
      : 0;

    scrollViewRef.current?.scrollTo({
      x: index * ITEM_WIDTH,
      animated: true,
    });
  }, [selectedFriend?.id]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const onScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / ITEM_WIDTH);
    const clampedIndex = Math.max(0, Math.min(index, totalItems - 1));

    if (clampedIndex === 0) {
      setSelectedFriend(null)
    } else {
      setSelectedFriend(friends[clampedIndex - 1])
    }
  };

  return (
    <View style={[styles.container, customStyle]}>
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
        {/* Empty placeholder item at index 0 */}
        <PlaceholderItem index={0} scrollX={scrollX} />

        {friends.map((friend, index) => (
          <FriendItem
            key={friend.id}
            friend={friend}
            index={index + 1}
            scrollX={scrollX}
          />
        ))}
      </AnimatedScrollView>
    </View>
  );
}

type PlaceholderItemProps = {
  index: number;
  scrollX: SharedValue<number>;
};

function PlaceholderItem({ index, scrollX }: PlaceholderItemProps) {
  const setSelectedFriend = useMediaStore((s) => s.setSelectedFriend);
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * ITEM_WIDTH,
      index * ITEM_WIDTH,
      (index + 1) * ITEM_WIDTH,
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
    <TouchableOpacity onPress={() => {
      setSelectedFriend(null)
    }} style={styles.friendItemContainer}>
      <Animated.View style={[styles.friendItem, animatedStyle]}>
        <View style={styles.placeholderAvatar} />
      </Animated.View>
    </TouchableOpacity>
  );
}

type FriendItemProps = {
  friend: Friend;
  index: number;
  scrollX: SharedValue<number>;
};

function FriendItem({ friend, index, scrollX }: FriendItemProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * ITEM_WIDTH,
      index * ITEM_WIDTH,
      (index + 1) * ITEM_WIDTH,
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
      [1, 1, 1],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const setSelectedFriend = useMediaStore((s) => s.setSelectedFriend);

  return (
    <View style={styles.friendItemContainer}>
      <Animated.View style={[styles.friendItem, animatedStyle]}>
        <CustomProfilePictureCircle
          size={64}
          imgUrl={friend.avatar}
          nickname={friend.name}
          userId={friend.id}
          handleClick={() => {
            setSelectedFriend(friend)
          }}
        />
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
  friendItemContainer: {
    width: ITEM_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendItem: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'visible',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});