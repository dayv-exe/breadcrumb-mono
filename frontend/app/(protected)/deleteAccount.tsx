import CustomButton from "@/components/buttons/CustomButton";
import CustomLabel from "@/components/CustomLabel";
import Spacer from "@/components/Spacer";
import CustomView from "@/components/views/CustomView";
import { Colors } from "@/constants/Colors";
import { Image, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DeleteAccountScreen() {

  return (
    <CustomView backgroundColor={Colors.light.vibrantBackground}>
      <SafeAreaView>
        <View style={{ flex: 1, }}>
          <Image style={{ width: 80, height: 80 }} source={require("../../assets/images/bread-no-bg.png")} />
          <CustomLabel bold fontSize={23} width="auto" labelText="Thank you for trying Breadcrumb" />
          <CustomLabel width="auto" fontSize={20} labelText="Your account and all associated information stored on our servers will be permanently deleted, including (but not limited to) all your photos, videos and texts." />
        </View>

        <Spacer />
        <CustomButton type="prominent" labelText="Next" />
      </SafeAreaView>
    </CustomView>
  )
}