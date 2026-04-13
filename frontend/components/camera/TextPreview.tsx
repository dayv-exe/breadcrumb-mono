import { MediaData } from "@/constants/media";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuthStore } from "@/utils/authStore";
import { useMediaStore } from "@/utils/mediaStore";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useShallow } from "zustand/shallow";
import { useBottomSheet } from "../bottomsheet/BottomSheetContext";
import CustomButton from "../buttons/CustomButton";
import CustomLabel from "../CustomLabel";
import WriteCrumb from "../editor/WriteCrumb";
import CustomProfilePictureCircle from "../profile/CustomProfilePictureCircle";
import Spacer from "../Spacer";

type props = {
  media: MediaData
}

export default function TextPreview({ media }: props) {
  const bg = useThemeColor({}, "background")
  const { openSheet, closeSheet } = useBottomSheet()
  const { top } = useSafeAreaInsets()
  const { height } = useWindowDimensions()
  const maxSheetHeight = height - top
  const updateText = useMediaStore(s => s.updateCurrentMediaText)
  const {nickname, fullname, userId} = useAuthStore(useShallow(s => ({
      nickname: s.userNickname,
      fullname: s.userFullname,
      userId: s.userId
    })))

    console.log(userId)

  function Crumb() {
    return (
      <View style={[styles.textPopup, {
        backgroundColor: bg
      }]}>
        <View style={styles.header}>
          <CustomProfilePictureCircle size={65} nickname={nickname} userId={userId}/>
          <Spacer size="small" />
          <View>
            <CustomLabel labelText={nickname ?? "<not found>"} adaptToTheme bold padding={0} fontSize={16} />
            <Spacer size="tiny" />
            <CustomLabel labelText={fullname ?? nickname ?? "<not found>"} adaptToTheme fade padding={0} fontSize={15} />
          </View>
        </View>
        <Spacer size="small" />
        <CustomLabel labelText={media.text} adaptToTheme customStyle={{ paddingHorizontal: 10, lineHeight: 24 }} />
        <Spacer size="small" />
        <View style={{
          width: "auto",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-end"
        }}>
          <CustomButton labelText="Edit" type="less-vibrant-text" adaptToTheme customStyle={{ padding: 0 }} imgSrc={require("../../assets/images/icons/pencil_sel_vibrant.png")} imgSize={14} handleClick={() => {
            openSheet({
              content: (
                <WriteCrumb
                  handleCancel={closeSheet}
                  handleSave={crumb => {
                    updateText(crumb)
                    closeSheet()
                  }}
                  text={media.text}
                />
              ),
              snapPoints: [maxSheetHeight],
              showHandle: false,
              reduceAnimations: true,
              borderRadius: 25
            })
          }} />
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Crumb />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center"
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  textPopup: {
    width: "90%",
    padding: 25,
    borderRadius: 25
  },
  inputContainer: {
    maxWidth: "80%",
    marginLeft: 10,
    flexShrink: 1,
    padding: 0,
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  input: {
    backgroundColor: "transparent",
    padding: 0,
    fontWeight: "400",
    lineHeight: 21
  },
})