import { StyleSheet, TouchableOpacity, View } from "react-native";
import CustomLabel from "../CustomLabel";

export default function EditorTools() {
  return (
    <View style={styles.container}>
      <TouchableOpacity>
        <CustomLabel />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start"
  },
})