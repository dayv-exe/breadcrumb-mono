import { useThemeColor } from '@/hooks/useThemeColor';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { SharedValue, useSharedValue } from 'react-native-reanimated';
import { BottomSheetOptions } from './BottomSheetTypes';

type BottomSheetContextType = {
  openSheet: (options: BottomSheetOptions) => void;
  closeSheet: () => void
  animatedPosition: SharedValue<number>
};

const BottomSheetContext = createContext<BottomSheetContextType | undefined>(undefined)

const DEFAULT_OPTIONS: BottomSheetOptions = {
  content: null,
  snapPoints: ['50%'],
  dynamicHeight: false,
  tapOutsideDismiss: true,
  showHandle: true,
  reduceAnimations: false,
  fullExpansionOnOpen: true,
  isScrollableContent: false,
  useRawComponent: false,
}

export const BottomSheetProvider = ({ children }: { children: ReactNode }) => {
  const { height: screenHeight } = useWindowDimensions()
  const bottomSheetRef = useRef<BottomSheet>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [sheetOptions, setSheetOptions] = useState<BottomSheetOptions>(DEFAULT_OPTIONS)

  const optionsRef = useRef<BottomSheetOptions>(DEFAULT_OPTIONS)
  const openIdRef = useRef(0)
  const closingIdRef = useRef<number | null>(null)
  const [openRequest, setOpenRequest] = useState(0)

  const openSheet = useCallback((options: BottomSheetOptions) => {
    const next: BottomSheetOptions = {
      snapPoints: options.snapPoints,
      dynamicHeight: options.dynamicHeight ?? false,
      content: options.content,
      backgroundStyle: options.backgroundStyle,
      onSheetDismissed: options.onSheetDismissed,
      allowDrag: options.allowDrag ?? true,
      showOverlay: options.showOverlay ?? true,
      tapOutsideDismiss: options.tapOutsideDismiss ?? true,
      showHandle: options.showHandle ?? true,
      reduceAnimations: options.reduceAnimations,
      fullExpansionOnOpen: options.fullExpansionOnOpen ?? true,
      borderRadius: options.borderRadius ?? 35,
      isScrollableContent: options.isScrollableContent ?? false,
      useRawComponent: options.useRawComponent ?? false,
      absoluteFill: options.absoluteFill,
      onChange: options.onChange,
    }

    openIdRef.current += 1
    optionsRef.current = next
    setSheetOptions(next)
    setIsSheetOpen(true)
    setOpenRequest(openIdRef.current)
  }, [])

  useEffect(() => {
    if (!openRequest) return
    const frame = requestAnimationFrame(() => {
      if (optionsRef.current.fullExpansionOnOpen) {
        bottomSheetRef.current?.expand()
      } else {
        bottomSheetRef.current?.snapToIndex(0)
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [openRequest])

  const closeSheet = useCallback(() => {
    bottomSheetRef.current?.close()
  }, [])

  const handleAnimate = useCallback((_fromIndex: number, toIndex: number) => {
    if (toIndex === -1) closingIdRef.current = openIdRef.current
  }, [])

  const handleSheetClose = useCallback(() => {
    const closingId = closingIdRef.current
    closingIdRef.current = null

    if (closingId !== null && closingId !== openIdRef.current) return

    setIsSheetOpen(false)
    optionsRef.current.onSheetDismissed?.()
  }, [])

  const handleChange = useCallback((_index: number, position: number) => {
    optionsRef.current.onChange?.(position)
  }, [])

  const renderBackdrop = useCallback((props: any) => (
    <BottomSheetBackdrop
      {...props}
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      pressBehavior={sheetOptions.tapOutsideDismiss ? "close" : "none"}
    />
  ), [sheetOptions.tapOutsideDismiss])

  const snapPoints = sheetOptions.dynamicHeight ? undefined : (sheetOptions.snapPoints ?? ['50%'])

  const bgCol = useThemeColor({}, "background")
  const handleCol = useThemeColor({}, "text")
  const animatedPosition = useSharedValue(screenHeight)

  const animationConfigs = {
    stiffness: 500,
    damping: sheetOptions.reduceAnimations ? 120 : 20,
    mass: 0.5,
  }

  const radius = sheetOptions.borderRadius ?? 35
  const handleIndicatorStyle = { backgroundColor: handleCol }
  const handleStyle = {
    backgroundColor: sheetOptions.backgroundStyle?.backgroundColor ?? "transparent",
    borderTopLeftRadius: radius,
    borderTopRightRadius: radius,
  }
  const backgroundStyle = [
    { backgroundColor: bgCol },
    sheetOptions.showOverlay ? styles.sheet : styles.sheetWithShadow,
    { borderTopLeftRadius: radius, borderTopRightRadius: radius },
    sheetOptions.backgroundStyle,
  ]
  const bottomSheetViewStyle = [sheetOptions.absoluteFill ? StyleSheet.absoluteFill : undefined, { flex: 1 }]

  const contextValue = { openSheet, closeSheet, animatedPosition }

  return (
    <BottomSheetContext.Provider value={contextValue}>
      {children}
      <BottomSheet

        key={sheetOptions.dynamicHeight ? 'dynamic' : 'fixed'}
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enableDynamicSizing={sheetOptions.dynamicHeight}
        enableOverDrag={sheetOptions.allowDrag ?? true}
        enableContentPanningGesture={true}
        enableHandlePanningGesture={sheetOptions.allowDrag ?? true}
        handleIndicatorStyle={handleIndicatorStyle}
        handleStyle={handleStyle}
        handleComponent={sheetOptions.showHandle ? undefined : null}
        enablePanDownToClose={sheetOptions.allowDrag ?? true}
        backdropComponent={sheetOptions.showOverlay !== false ? renderBackdrop : undefined}
        backgroundStyle={backgroundStyle}
        animationConfigs={animationConfigs}
        onAnimate={handleAnimate}
        onClose={handleSheetClose}
        onChange={handleChange}
        animatedPosition={animatedPosition}
      >
        {!sheetOptions.useRawComponent && !sheetOptions.isScrollableContent && (
          <BottomSheetView style={bottomSheetViewStyle}>
            {isSheetOpen && sheetOptions.content}
          </BottomSheetView>
        )}
        {!sheetOptions.useRawComponent && sheetOptions.isScrollableContent && (
          <BottomSheetScrollView>
            {isSheetOpen && sheetOptions.content}
          </BottomSheetScrollView>
        )}
        {sheetOptions.useRawComponent && isSheetOpen && sheetOptions.content}
      </BottomSheet>
    </BottomSheetContext.Provider>
  )
}

export const useBottomSheet = () => {
  const context = useContext(BottomSheetContext);
  if (!context) throw new Error('useBottomSheet must be used within a BottomSheetProvider')
  return context
}

const styles = StyleSheet.create({
  sheet: {},
  sheetWithShadow: {
    shadowRadius: 10,
    shadowOpacity: .15,
    elevation: 5,
  }
})