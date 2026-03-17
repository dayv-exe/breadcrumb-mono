import { useThemeColor } from "@/hooks/useThemeColor";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import ElevatedSection from "./ElevatedSection";

interface ElevatedListProps<T> {
  title: string
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function ElevatedList<T>({
  style,
  title,
  data,
  keyExtractor,
  renderItem,
}: ElevatedListProps<T>) {
  const fadedBg = useThemeColor({}, "fadedBackground")
  return (
    <ElevatedSection title={title} style={style}>
      {
        data.map((item, index) => {
          return (
            <View key={keyExtractor(item, index)}>
              {renderItem(item, index)}
              {index + 1 < data.length && <View style={{ borderBottomWidth: 1, borderBottomColor: fadedBg }} />}
            </View>
          )
        })
      }
    </ElevatedSection>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 15
  }
})