import { useThemeColor } from '@/hooks/useThemeColor';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState
} from 'react';
import { StyleSheet, ViewStyle } from 'react-native';

type BottomSheetOptions = {
  content: ReactNode
  snapPoints?: (string | number)[]
  dynamicHeight?: boolean
  allowDrag?: boolean
  showOverlay?: boolean
  backgroundStyle?: ViewStyle
  tapOutsideDismiss?: boolean
  onSheetDismissed?: () => void
  showHandle?: boolean
  reduceAnimations?: boolean
  fullExpansionOnOpen?: boolean
};

type BottomSheetContextType = {
  openSheet: (options: BottomSheetOptions) => void;
  closeSheet: () => void
};

const BottomSheetContext = createContext<BottomSheetContextType | undefined>(undefined)

export const BottomSheetProvider = ({ children }: { children: ReactNode }) => {
  const bottomSheetRef = useRef<BottomSheet>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [sheetOptions, setSheetOptions] = useState<BottomSheetOptions>({
    content: null,
    snapPoints: ['50%'],
    dynamicHeight: false,
    tapOutsideDismiss: true,
    showHandle: true,
    reduceAnimations: false,
    fullExpansionOnOpen: true,
  })

  const openSheet = useCallback((options: BottomSheetOptions) => {
    setSheetOptions({
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
      fullExpansionOnOpen: options.fullExpansionOnOpen ?? true
    })
    setIsSheetOpen(true)
    switch (options.fullExpansionOnOpen) {
      case true:
        setTimeout(() => bottomSheetRef.current?.expand(), 50)
        break;

      default:
        setTimeout(() => bottomSheetRef.current?.snapToIndex(0), 50)
        break;
    }
  }, [])

  const closeSheet = useCallback(() => {
    bottomSheetRef.current?.close()
  }, [])

  const handleSheetClose = useCallback(() => {
    setIsSheetOpen(false)
    sheetOptions.onSheetDismissed?.()
  }, [sheetOptions])

  const renderBackdrop = useCallback((props: any) => (
    <BottomSheetBackdrop
      {...props}
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      pressBehavior={sheetOptions.tapOutsideDismiss ? "close" : "none"}
    />
  ), [sheetOptions.tapOutsideDismiss])

  const snapPoints = useMemo(() =>
    sheetOptions.dynamicHeight ? undefined : (sheetOptions?.snapPoints ?? ['50%']),
    [sheetOptions]
  );

  const bgCol = useThemeColor({}, "background")
  const handleCol = useThemeColor({}, "text")

  return (
    <BottomSheetContext.Provider value={{ openSheet, closeSheet }}>
      {children}

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enableDynamicSizing={sheetOptions.dynamicHeight}
        enableOverDrag={sheetOptions.allowDrag ?? true}
        enableContentPanningGesture={sheetOptions.allowDrag ?? true}
        enableHandlePanningGesture={sheetOptions.allowDrag ?? true}
        handleIndicatorStyle={{ backgroundColor: handleCol }}
        handleComponent={sheetOptions.showHandle ? undefined : null}
        enablePanDownToClose={sheetOptions.allowDrag ?? true}
        backdropComponent={sheetOptions.showOverlay !== false ? renderBackdrop : undefined}
        backgroundStyle={[sheetOptions.backgroundStyle, { backgroundColor: bgCol }, sheetOptions.showOverlay ? styles.sheet : styles.sheetWithShadow]}
        animationConfigs={!sheetOptions.reduceAnimations ? {
          stiffness: 500,
          damping: 20,
          mass: 0.5,
        } : {
          stiffness: 500,
          damping: 120,
          mass: 0.5,
        }}
        onClose={handleSheetClose}
      >
        <BottomSheetView>
          {isSheetOpen && sheetOptions.content}
        </BottomSheetView>
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
  sheet: {
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
  },
  sheetWithShadow: {
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    shadowRadius: 10,
    shadowOpacity: .15,
    elevation: 5,
  }
})