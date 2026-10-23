import { CrumbMailbox } from "@/api/models/crumb";
import { useThemeColor } from "@/hooks/useThemeColor";
import { CheckIcon } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomButton from "../buttons/CustomButton";
import CustomLabel from "../CustomLabel";
import Spacer from "../Spacer";

type MailboxPickerType = {
  mailbox: CrumbMailbox
  onChange: (m: CrumbMailbox) => void
}

export default function MailboxPicker({ mailbox, onChange }: MailboxPickerType) {
  const insets = useSafeAreaInsets()
  const textCol = useThemeColor({}, "text")

  return (
    <View
      style={[styles.container, {
        paddingBottom: insets.bottom
      }]}
    >
      <CustomLabel adaptToTheme textAlign="center" labelText="Mailbox" fontSize={23} bold />

      <Spacer size="medium" />

      <CustomButton
        freed
        type="text"
        handleClick={() => {
          onChange("received")
        }}
      >
        <CustomLabel adaptToTheme labelText="Unopened" />
        {mailbox === "received" && <CheckIcon size={18} strokeWidth={2} stroke={textCol} />}
      </CustomButton>

      <Spacer />
      <CustomButton
        freed
        type="text"
        handleClick={() => {
          onChange("sent")
        }}
      >
        <CustomLabel adaptToTheme labelText="Sent" />
        {mailbox === "sent" && <CheckIcon size={18} strokeWidth={2} stroke={textCol} />}
      </CustomButton>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    minHeight: 150,
  }
})