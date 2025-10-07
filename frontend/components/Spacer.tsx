import { StyleSheet, View } from "react-native";

type spaceSize = "tiny" | "small" | "medium" | "big"

type sProps = {
  size?: spaceSize
}

export default function Spacer({ size = "medium" }: sProps) {
  return (
    <View style={
      size === "big" ? styles.big :
        size === "medium" ? styles.medium :
          size === "small" ? styles.small :
            styles.tiny
    }>

    </View>
  )
}

const styles = StyleSheet.create({
  tiny: {
    padding: 2
  },
  small: {
    padding: 5
  },
  medium: {
    padding: 10
  },
  big: {
    padding: 20
  },
})