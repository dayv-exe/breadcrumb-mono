import CustomButton from "@/components/buttons/CustomButton"
import { PropsWithChildren } from "react"
import { StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

type props = {
  handleCloseSheet: () => void
}

export default function EditSettingSheet({ handleCloseSheet, children }: PropsWithChildren<props>) {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.container, {marginTop: 20}]}>
      <View style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "flex-start", flexDirection: "row" }}>
        <CustomButton customStyle={styles.close} paddingHorizontal={0} handleClick={handleCloseSheet} type="less-vibrant-text" labelText="Cancel" />
      </View>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container:{
    position: "relative",
  },
  close: {
    position: "absolute",
    top: 0,
    right: 0,
  }
})