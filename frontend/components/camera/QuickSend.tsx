import { Friend } from "@/utils/mediaStore";
import { StyleSheet, View } from "react-native";
import CustomLabel from "../CustomLabel";

type props = {
  friend: Friend
}

export default function QuickSend({ friend }: props) {
  return (
    <View pointerEvents="box-none" style={styles.container}>
      <CustomLabel labelText={`Sending to ${friend.name}`} bold textAlign="center" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    width: "80%",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: .3,
    shadowRadius: 10,
  }
})