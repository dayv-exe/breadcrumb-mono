import { StyleProp, View, ViewStyle } from "react-native";

interface ElevatedSectionProps<T> {
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function ElevatedSection() {
  return (
    <View>

    </View>
  )
}