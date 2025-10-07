import { useEffect } from "react"
import { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated"


interface pulseAnimationConfig {
  duration?: number
}

export const usePulseAnimation = (isActive: boolean, config: pulseAnimationConfig = {}) => {
  const {
    duration = 800,
  } = config

  const animatedVal = useSharedValue(1)
  const animStyle = useAnimatedStyle(() => {
    return { opacity: animatedVal.value }
  })

  useEffect(() => {
    if (isActive) {
      const targetVal = 0.3
      animatedVal.value = withRepeat(
        withTiming(targetVal, { duration }),
        -1,
        true
      )
    } else {
      cancelAnimation(animatedVal)
      animatedVal.value = withTiming(1, { duration: 200 })
    }
  }, [isActive, duration])

  return animStyle
}