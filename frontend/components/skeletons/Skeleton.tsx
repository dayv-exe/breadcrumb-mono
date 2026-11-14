import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

type Props = {
  width?: ViewStyle['width'];
  height?: ViewStyle['height'];
  borderRadius?: ViewStyle['borderRadius'];
  style?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  glintColor?: string;
  glintWidth?: number;
  duration?: number;
  delay?: number;
};

function transparentize(color: string): string {
  const c = color.trim();

  const hex = c.match(/^#([0-9a-f]{3,8})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3 || h.length === 4) {
      h = h
        .slice(0, 3)
        .split('')
        .map((x) => x + x)
        .join('');
    } else {
      h = h.slice(0, 6);
    }
    if (h.length === 6) return `#${h}00`;
  }

  const rgb = c.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
  if (rgb) return `rgba(${rgb[1]}, ${rgb[2]}, ${rgb[3]}, 0)`;

  return 'transparent';
}

const Skeleton = ({
  width = '100%',
  height = 20,
  borderRadius = 0,
  style,
  backgroundColor,
  glintColor,
  glintWidth,
  duration = 1200,
  delay = 300,
}: Props) => {
  const themeBackground = useThemeColor({}, 'fadedBackground');
  const mode = useColorScheme();

  const [progress] = useState(() => new Animated.Value(0));
  const [layoutWidth, setLayoutWidth] = useState(0);

  const glint =
    glintColor ?? (mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.6)');
  const edge = useMemo(() => transparentize(glint), [glint]);
  const bandWidth = glintWidth ?? Math.max(layoutWidth * 0.6, 40);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    setLayoutWidth((prev) => (prev === w ? prev : w));
  }, []);

  useEffect(() => {
    if (layoutWidth === 0) return;

    progress.setValue(0);
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(delay),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [progress, layoutWidth, duration, delay]);

  const translateX = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 1],
        outputRange: [-bandWidth, layoutWidth],
      }),
    [progress, bandWidth, layoutWidth],
  );

  return (
    <View
      onLayout={onLayout}
      accessible
      accessibilityLabel="Loading"
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: backgroundColor ?? themeBackground,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {layoutWidth > 0 && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: bandWidth,
            transform: [{ translateX }],
          }}
        >
          <LinearGradient
            colors={[edge, glint, edge]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      )}
    </View>
  );
};

export default Skeleton;