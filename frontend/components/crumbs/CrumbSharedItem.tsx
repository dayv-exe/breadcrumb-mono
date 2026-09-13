import { Crumb } from "@/api/models/crumb";
import { Colors } from "@/constants/Colors";
import { View } from "react-native";
import CustomButton from "../buttons/CustomButton";
import CustomLabel from "../CustomLabel";
import Spacer from "../Spacer";

interface props {
  crumb: Crumb
}

export default function CrumbSharedItem({ crumb }: props) {
  return (
    <CustomButton
      freed
      type="theme-faded"
      customStyle={{
        marginHorizontal: 15,
        borderRadius: 10,
        justifyContent: "flex-start",
        padding: 20,
        marginBottom: 10,
      }}
    >
      <View
        style={{
          width: 15,
          height: 15,
          backgroundColor: Colors.light.vibrantBackground,
          borderRadius: 2.5,
        }}
      />
      <Spacer size="small" />
      <CustomLabel adaptToTheme width="auto" labelText={crumb.mailbox === "sent" ? "" : crumb.unlocked ? "Tap to view" : "Locked"} />
    </CustomButton>
  )
}