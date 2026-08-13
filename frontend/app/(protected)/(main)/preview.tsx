import CustomButton from "@/components/buttons/CustomButton";
import CustomLabel from "@/components/CustomLabel";
import Spacer from "@/components/Spacer";
import { UseGetAddress } from "@/hooks/useGetAddress";
import { useThemeColor } from "@/hooks/useThemeColor";
import { ChevronLeftIcon } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Preview() {
  const bgCol = useThemeColor({}, "background")
  const insets = useSafeAreaInsets()
  const { address } = UseGetAddress()

  return (
    <View
      style={[styles.container, {
        backgroundColor: "black"
      }]}
    >
      <View
        style={[styles.header, {
          top: insets.top,
        }]}
      >
        <CustomButton
          freed
          customStyle={[
            styles.backButton
          ]}
          type="text"
        >
          <ChevronLeftIcon stroke={"white"} strokeWidth={3.5} size={25} />
        </CustomButton>
        <View
          style={[

          ]}
        >
          <CustomLabel
            textAlign="center"
            bold
            width="auto"
            labelText={"Share crumbs"}
            padding={0}
            fontSize={18}
          />
          <Spacer size="tiny" />
          <CustomLabel
            textAlign="center"
            fade
            width="auto"
            labelText={address?.split(",")[0] ?? "Current Location"}
            padding={0}
            fontSize={14}
          />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: "absolute",
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  title: {

  },
  backButton: {
    position: "absolute",
    left: 15,
  }
})