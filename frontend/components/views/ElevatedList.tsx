import { useThemeColor } from "@/hooks/useThemeColor";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import CustomLabel from "../CustomLabel";
import Spacer from "../Spacer";
import ElevatedView from "./ElevatedView";

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
    <View style={styles.container}>
      <CustomLabel labelText={title} fontSize={15} adaptToTheme bold />
      <Spacer size="tiny" />
      <ElevatedView style={style}>
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
      </ElevatedView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 15
  }
})