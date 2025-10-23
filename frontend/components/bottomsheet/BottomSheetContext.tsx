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
  content: ReactNode;
  snapPoints: (string | number)[];
  backgroundStyle?: ViewStyle;
};

type BottomSheetContextType = {
  openSheet: (options: BottomSheetOptions) => void;
  closeSheet: () => void;
};

const BottomSheetContext = createContext<BottomSheetContextType | undefined>(undefined);

export const BottomSheetProvider = ({ children }: { children: ReactNode }) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [sheetOptions, setSheetOptions] = useState<BottomSheetOptions>({
    content: null,
    snapPoints: ['50%'],
  });

  const openSheet = useCallback((options: BottomSheetOptions) => {
    setSheetOptions({
      snapPoints: options.snapPoints || ['50%'],
      content: options.content,
      backgroundStyle: options.backgroundStyle,
    });
    setTimeout(() => bottomSheetRef.current?.expand(), 50);
  }, []);

  const closeSheet = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

  const renderBackdrop = useCallback((props: any) => (
    <BottomSheetBackdrop
      {...props}
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      pressBehavior="close"
    />
  ), []);

  const snapPoints = useMemo(() => sheetOptions?.snapPoints ?? ['90'], [sheetOptions]);
  const bgCol = useThemeColor({}, "background")

  return (
    <BottomSheetContext.Provider value={{ openSheet, closeSheet }}>
      {children}

      {<BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        handleComponent={null}
        enableOverDrag={false}
        enableContentPanningGesture={false}
        enableHandlePanningGesture={false}
        backdropComponent={renderBackdrop}
        backgroundStyle={[sheetOptions.backgroundStyle, { backgroundColor: bgCol }, styles.sheet]}
        animationConfigs={{ duration: 150 }}
      >
        <BottomSheetView style={{ padding: 20 }}>
          {sheetOptions.content}
        </BottomSheetView>
      </BottomSheet>}
    </BottomSheetContext.Provider>
  );
};

export const useBottomSheet = () => {
  const context = useContext(BottomSheetContext);
  if (!context) throw new Error('useBottomSheet must be used within a BottomSheetProvider');
  return context;
};

const styles = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
  }
})
