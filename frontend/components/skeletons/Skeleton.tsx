import { useColorScheme } from '@/hooks/useColorScheme.web';
import { useThemeColor } from '@/hooks/useThemeColor';
import React, { useEffect, useRef } from 'react';
import { AnimatableNumericValue, Animated, DimensionValue, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

type props = {
  width?: number
  height?: DimensionValue
  borderRadius?: string | AnimatableNumericValue
}

const Skeleton = ({ width = 200, height = 20, borderRadius = 5 }: props) => {
  const translateX = useRef(new Animated.Value(-width)).current;
  const theme = useThemeColor
  const mode = useColorScheme()

  useEffect(() => {
    const animate = () => {
      translateX.setValue(-width);
      Animated.timing(translateX, {
        toValue: width,
        duration: 1500,
        useNativeDriver: true,
      }).start(() => animate());
    };
    animate();
  }, [translateX, width]);

  return (
    <View
      style={{
        width,
        height,
        backgroundColor: theme({}, "fadedBackground"),
        borderRadius,
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          transform: [{ translateX }],
        }}
      >
        <LinearGradient
          colors={
            mode === "light" ? 
            ["transparent", "rgba(0, 0, 0, 0.05)", "transparent", "rgba(0, 0, 0, 0.05)", "transparent"] :
            ["transparent", "rgba(0, 0, 0, 0.25)", "transparent", "rgba(0, 0, 0, 0.25)", "transparent"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 2, y: 0 }}
          style={{
            width: '100%',
            height: '100%',
          }}
        />
      </Animated.View>
    </View>
  );
};

export default Skeleton;