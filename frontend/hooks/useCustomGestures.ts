import { useRef } from "react"

interface TouchPosition {
  x: number
  y: number
  timestamp: number
}

interface GestureCallbacks {
  onSingleTap?: (position: { x: number; y: number }) => void
  onDoubleTap?: (position: { x: number; y: number }) => void
  onSwipe?: (direction: 'up' | 'down' | 'left' | 'right', distance: number) => void
  onLongPress?: (position: { x: number; y: number }) => void
}

interface GestureConfig {
  doubleTapDelay?: number
  swipeThreshold?: number 
  longPressDelay?: number
  tapMovementThreshold?: number 
}

export function useCustomGestures(
  callbacks: GestureCallbacks,
  config: GestureConfig = {}
) {
  const {
    doubleTapDelay = 300,
    swipeThreshold = 30,
    longPressDelay = 500,
    tapMovementThreshold = 10,
  } = config

  const touchStart = useRef<TouchPosition | null>(null)
  const lastTap = useRef<TouchPosition | null>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const singleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasMoved = useRef(false)

  const clearTimers = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    if (singleTapTimer.current) {
      clearTimeout(singleTapTimer.current)
      singleTapTimer.current = null
    }
  }

  const getDistance = (p1: TouchPosition, p2: TouchPosition) => {
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  const getSwipeDirection = (start: TouchPosition, end: TouchPosition): 'up' | 'down' | 'left' | 'right' => {
    const dx = end.x - start.x
    const dy = end.y - start.y
    
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left'
    } else {
      return dy > 0 ? 'down' : 'up'
    }
  }

  const handleTouchStart = (e: any) => {
    const touch = e.nativeEvent.touches?.[0] || e.nativeEvent
    
    touchStart.current = {
      x: touch.pageX,
      y: touch.pageY,
      timestamp: Date.now(),
    }
    
    hasMoved.current = false
    clearTimers()

    // start long press timer
    if (callbacks.onLongPress) {
      longPressTimer.current = setTimeout(() => {
        if (touchStart.current && !hasMoved.current) {
          callbacks.onLongPress?.({
            x: touchStart.current.x,
            y: touchStart.current.y,
          })
          touchStart.current = null // prevent other gestures after long press
        }
      }, longPressDelay)
    }
  }

  const handleTouchMove = (e: any) => {
    if (!touchStart.current) return

    const touch = e.nativeEvent.touches?.[0] || e.nativeEvent
    const currentPos = { x: touch.pageX, y: touch.pageY, timestamp: Date.now() }
    const distance = getDistance(touchStart.current, currentPos)

    if (distance > tapMovementThreshold) {
      hasMoved.current = true
      clearTimers()
    }
  }

  const handleTouchEnd = (e: any) => {
    clearTimers()

    if (!touchStart.current) return

    const touch = e.nativeEvent.changedTouches?.[0] || e.nativeEvent
    const touchEnd: TouchPosition = {
      x: touch.pageX,
      y: touch.pageY,
      timestamp: Date.now(),
    }

    const distance = getDistance(touchStart.current, touchEnd)

    // check for swipe
    if (hasMoved.current && distance > swipeThreshold) {
      const direction = getSwipeDirection(touchStart.current, touchEnd)
      callbacks.onSwipe?.(direction, distance)
      touchStart.current = null
      return
    }

    // check for tap (single or double)
    if (!hasMoved.current && distance < tapMovementThreshold) {
      const currentTap = touchEnd

      // check for double tap
      if (
        lastTap.current &&
        currentTap.timestamp - lastTap.current.timestamp < doubleTapDelay
      ) {
        // double tap detected
        if (singleTapTimer.current) {
          clearTimeout(singleTapTimer.current)
          singleTapTimer.current = null
        }
        callbacks.onDoubleTap?.({ x: currentTap.x, y: currentTap.y })
        lastTap.current = null // reset to prevent triple tap
      } else {
        // wait to see if there's a second tap
        lastTap.current = currentTap
        
        callbacks.onSingleTap?.({ x: currentTap.x, y: currentTap.y })
        singleTapTimer.current = setTimeout(() => {
          // callbacks.onSingleTap?.({ x: currentTap.x, y: currentTap.y })
          lastTap.current = null
        }, doubleTapDelay)
      }
    }

    touchStart.current = null
  }

  const handleTouchCancel = () => {
    clearTimers()
    touchStart.current = null
    hasMoved.current = false
  }

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
  }
}