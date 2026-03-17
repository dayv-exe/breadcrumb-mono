import { PropsWithChildren } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import CustomLabel from "../CustomLabel";
import Spacer from "../Spacer";
import ElevatedView from "./ElevatedView";

interface ElevatedSectionProps {
  title: string
  style?: StyleProp<ViewStyle>;
}

export default function ElevatedSection({ title, style, children }: PropsWithChildren<ElevatedSectionProps>) {
  return (
    <View style={styles.container}>
      <CustomLabel labelText={title} fontSize={14} adaptToTheme bold />
      <Spacer size="tiny" />
      <ElevatedView style={style}>
        {
          children
        }
      </ElevatedView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 15
  }
})