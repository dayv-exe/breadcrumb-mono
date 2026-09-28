import { useColorScheme } from "@/hooks/useColorScheme.web";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import CustomLabel from "../CustomLabel";
import Spacer from "../Spacer";

type props = {
  nickname: string
  name?: string
  handleClick: () => void
}

export default function SearchHistoryItem({ name, nickname, handleClick }: props) {
  const mode = useColorScheme()
  return (
    <TouchableOpacity style={styles.container} onPress={handleClick}>
      <View style={styles.names}>
        <CustomLabel padding={0} adaptToTheme bold labelText={nickname} fontSize={15} />
        <Spacer size="tiny" />
        {name && <CustomLabel padding={0} adaptToTheme labelText={name} fontSize={15} fade />}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  names: {
    width: "100%",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    marginLeft: 10
  }
})