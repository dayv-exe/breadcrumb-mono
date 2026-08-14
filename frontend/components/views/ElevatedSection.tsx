import { PropsWithChildren } from "react";
import { StyleProp, StyleSheet, TextStyle, View, ViewStyle } from "react-native";
import CustomLabel from "../CustomLabel";
import Spacer from "../Spacer";
import ElevatedView from "./ElevatedView";

interface ElevatedSectionProps {
  title: string
  titleStyle?: StyleProp<TextStyle>
  style?: StyleProp<ViewStyle>;
}

export default function ElevatedSection({ title, style, children, titleStyle }: PropsWithChildren<ElevatedSectionProps>) {
  return (
    <View style={styles.container}>
      {title && <CustomLabel labelText={title} fontSize={14} adaptToTheme bold customStyle={titleStyle} />}
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