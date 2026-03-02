import { ActivityIndicator, StyleSheet, View } from "react-native";
import CustomLabel from "../CustomLabel";

interface props {
  text?: string
}

export default function BigActivityIndicator({ text }: props) {
  return (
    <View style={style.container}>
      <View style={[{  }, style.textContainer]}>
        <ActivityIndicator color={"#fff"} />
        <CustomLabel labelText={text ?? "Loading, please wait..."} textAlign="center" />
      </View>
    </View>
  )
}

const style = StyleSheet.create({
  container: {
    position: "absolute",
    flex: 1,
    alignItems: "center",
    justifyContent: 'center',
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, .75)"
  },
  textContainer: {
    padding: 10,
    alignItems: "center",
    justifyContent: 'center'
  },
})