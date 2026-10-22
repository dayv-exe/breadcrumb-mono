import { useThemeColor } from '@/hooks/useThemeColor';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetScrollView,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { createContext, ReactNode, RefObject, useCallback, useContext, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { SharedValue, useSharedValue } from 'react-native-reanimated';
import { BottomSheetOptions } from './BottomSheetTypes';

type BottomSheetContextType = {
  openSheet: (options: BottomSheetOptions) => void
  closeSheet: () => void
  animatedPosition: SharedValue<number>
}

type ActiveSheet = { id: number; options: BottomSheetOptions }

const BottomSheetContext = createContext<BottomSheetContextType | undefined>(undefined)

export const BottomSheetProvider = ({ children }: { children: ReactNode }) => {
  const { height: screenHeight } = useWindowDimensions()
  const animatedPosition = useSharedValue(screenHeight)
  const sheetRef = useRef<BottomSheet>(null)

  const [active, setActive] = useState<ActiveSheet | null>(null)
  const activeRef = useRef<ActiveSheet | null>(null)
  const nextId = useRef(0)

  // Opening = mounting a fresh sheet. It animates in by itself (animateOnMount).
  const openSheet = useCallback((options: BottomSheetOptions) => {
    // Replacing a sheet that's still open counts as dismissing it
    activeRef.current?.options.onSheetDismissed?.()
    const sheet = { id: ++nextId.current, options }
    activeRef.current = sheet
    setActive(sheet)
  }, [])

  // Closing = animate out; onClose then unmounts it.
  const closeSheet = useCallback(() => {
    sheetRef.current?.close()
  }, [])

  const handleClose = useCallback((id: number) => {
    const current = activeRef.current
    if (!current || current.id !== id) return // late close from a sheet that was already replaced
    activeRef.current = null
    setActive(null)
    current.options.onSheetDismissed?.()
  }, [])

  return (
    <BottomSheetContext.Provider value={{ openSheet, closeSheet, animatedPosition }}>
      {children}
      {active && (
        <Sheet
          key={active.id}
          options={active.options}
          sheetRef={sheetRef}
          animatedPosition={animatedPosition}
          onClose={() => handleClose(active.id)}
        />
      )}
    </BottomSheetContext.Provider>
  )
}

type SheetProps = {
  options: BottomSheetOptions
  sheetRef: RefObject<BottomSheet | null>
  animatedPosition: SharedValue<number>
  onClose: () => void
}

const Sheet = ({ options, sheetRef, animatedPosition, onClose }: SheetProps) => {
  const {
    content,
    snapPoints = ['50%'],
    dynamicHeight = false,
    backgroundStyle,
    allowDrag = true,
    showOverlay = true,
    tapOutsideDismiss = true,
    showHandle = true,
    reduceAnimations = false,
    fullExpansionOnOpen = true,
    borderRadius = 35,
    isScrollableContent = false,
    useRawComponent = false,
    absoluteFill = false,
    onChange,
  } = options

  const bgCol = useThemeColor({}, 'background')
  const handleCol = useThemeColor({}, 'text')

  const points = dynamicHeight ? undefined : snapPoints
  const index = fullExpansionOnOpen && points ? points.length - 1 : 0

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior={tapOutsideDismiss ? 'close' : 'none'}
      />
    ),
    [tapOutsideDismiss]
  )

  let body: ReactNode
  if (useRawComponent) {
    body = content
  } else if (isScrollableContent) {
    body = <BottomSheetScrollView>{content}</BottomSheetScrollView>
  } else {
    // No flex: 1 with dynamic sizing: the view must size to its content,
    // otherwise it stretches to the sheet and the measured height feeds back on itself.
    body = (
      <BottomSheetView style={[absoluteFill && StyleSheet.absoluteFill, !dynamicHeight && { flex: 1 }]}>
        {content}
      </BottomSheetView>
    )
  }

  return (
    <BottomSheet
      ref={sheetRef}
      index={index}
      animateOnMount
      snapPoints={points}
      enableDynamicSizing={dynamicHeight}
      enablePanDownToClose={allowDrag}
      enableOverDrag={allowDrag}
      enableHandlePanningGesture={allowDrag}
      enableContentPanningGesture
      handleComponent={showHandle ? undefined : null}
      handleIndicatorStyle={{ backgroundColor: handleCol }}
      handleStyle={{
        backgroundColor: backgroundStyle?.backgroundColor ?? 'transparent',
        borderTopLeftRadius: borderRadius,
        borderTopRightRadius: borderRadius,
      }}
      backgroundStyle={[
        { backgroundColor: bgCol, borderTopLeftRadius: borderRadius, borderTopRightRadius: borderRadius },
        !showOverlay && styles.shadow,
        backgroundStyle,
      ]}
      backdropComponent={showOverlay ? renderBackdrop : undefined}
      animationConfigs={{ stiffness: 500, damping: reduceAnimations ? 120 : 20, mass: 0.5 }}
      animatedPosition={animatedPosition}
      onChange={onChange ? (_i, position) => onChange(position) : undefined}
      onClose={onClose}
    >
      {body}
    </BottomSheet>
  )
}

export const useBottomSheet = () => {
  const context = useContext(BottomSheetContext)
  if (!context) throw new Error('useBottomSheet must be used within a BottomSheetProvider')
  return context
}

const styles = StyleSheet.create({
  shadow: {
    shadowRadius: 10,
    shadowOpacity: 0.15,
    elevation: 5,
  },
})