import { useThemeColor } from "@/hooks/useThemeColor";
import { StyleSheet, View } from "react-native";
import CustomLabel from "../CustomLabel";
import PieLoader from "../loaders/PieLoader";
import Spacer from "../Spacer";

interface props {
  title?: string
  uploadedCount: number
  totalCount: number
}
export default function CrumbsUploadingIndicator({ title, uploadedCount, totalCount }: props) {
  const bgCol = useThemeColor({}, "background")
  const pct = (uploadedCount / totalCount) * 100

  return (
    <View
      style={[styles.container, {
        backgroundColor: bgCol
      }]}
    >
      <CustomLabel adaptToTheme bold fontSize={17} labelText={title ?? "uploading media..."} />
      <Spacer size="medium" />
      <PieLoader percentage={pct} size={50} />
      <Spacer size="tiny" />
      <CustomLabel adaptToTheme fade fontSize={13} labelText={`item ${uploadedCount} / ${totalCount}`} />
      <Spacer size="small" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  }
})