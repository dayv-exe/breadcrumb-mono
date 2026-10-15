import { Crumb } from "@/api/models/crumb";
import { Colors } from "@/constants/Colors";
import { useThemeColor } from "@/hooks/useThemeColor";
import { View } from "react-native";
import CustomButton from "../buttons/CustomButton";
import CustomLabel from "../CustomLabel";
import Spacer from "../Spacer";

interface props {
  crumb: Crumb
}

export default function CrumbSharedItem({ crumb }: props) {
  const fadedBg = useThemeColor({}, "fadedBackground")

  return (
    <CustomButton
      freed
      type="text"
      disabled={!crumb.unlocked}
      customStyle={{
        marginHorizontal: 15,
        borderRadius: 10,
        borderWidth: .275,
        borderColor: fadedBg,
        justifyContent: "flex-start",
        padding: 20,
        marginBottom: 10,
      }}
    >
      <View
        style={{
          width: 15,
          height: 15,
          backgroundColor: crumb.unlocked ? Colors.light.vibrantButton : "transparent",
          borderColor: crumb.unlocked ? "transparent" : Colors.light.vibrantButton,
          borderWidth: 2,
          borderRadius: 3,
        }}
      />
      <Spacer size="small" />
      <View>
        <CustomLabel fontSize={15} adaptToTheme width="auto" bold={crumb.unlocked} labelText={crumb.mailbox === "sent" ? "" : crumb.unlocked ? "Tap to view" : "2 miles away • "}
        />
      </View>

      {!crumb.unlocked &&
        <>
          <CustomLabel allowTruncate fade adaptToTheme fontSize={13} labelText={crumb.formattedAddress} />
        </>
      }
    </CustomButton>
  )
}