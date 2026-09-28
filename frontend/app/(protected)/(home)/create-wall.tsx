import CustomLabel from "@/components/CustomLabel";
import CustomView from "@/components/views/CustomView";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CreateWallScreen() {
  return (
    <CustomView adaptToTheme>
      <SafeAreaView>
        <CustomLabel labelText="New wall" />
      </SafeAreaView>
    </CustomView>
  )
}