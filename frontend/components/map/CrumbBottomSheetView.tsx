import { View } from "react-native";
import CustomLabel from "../CustomLabel";
import Spacer from "../Spacer";

export default function CrumbBottomSheetView() {
  return (
    <View>
      <CustomLabel adaptToTheme bold labelText="selected crumb" />
      <Spacer size="big" />
      <Spacer size="big" />
      <Spacer size="big" />
    </View>
  )
}