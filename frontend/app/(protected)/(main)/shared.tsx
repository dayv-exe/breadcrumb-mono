import { UserInitialDetails } from "@/api/userApi";
import CustomButton from "@/components/buttons/CustomButton";
import PreviewBunch from "@/components/camera/PreviewBunch";
import CrumbSharedItem from "@/components/crumbs/CrumbSharedItem";
import CustomLabel from "@/components/CustomLabel";
import CustomProfilePictureCircle from "@/components/profile/CustomProfilePictureCircle";
import Spacer from "@/components/Spacer";
import { useCrumbsWith } from "@/hooks/queries/useLocalDatabase";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useLocationStore } from "@/utils/useLocationStore";
import { colorForUserId } from "@/utils/userColor";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeftIcon, MoreHorizontalIcon, PlusIcon } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Shared() {
  const textCol = useThemeColor({}, "text")
  const bgCol = useThemeColor({}, "background")
  const crumbBorderCol = useThemeColor({}, "fadedBackground")
  const insets = useSafeAreaInsets()
  const { userid, displayName } = useLocalSearchParams<UserInitialDetails>()
  const userCol = colorForUserId(userid)
  const topPadding = insets.top
  const { data: crumbs, error: crumbsError, isPending: crumbsPending } = useCrumbsWith(userid, useLocationStore.getState().coordinates!)

  const router = useRouter()

  const handleGoBack = () => {
    router.dismiss()
  }

  const [headerHeight, setHeaderHeight] = useState(0)

  return (
    <View
      style={[styles.container, {
        backgroundColor: bgCol
      }]}
    >
      <ScrollView
        style={{
          flex: 1,
        }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: headerHeight + 15,
        }}
      >
        <CustomLabel labelText="nearby" bold adaptToTheme fontSize={12} textAlign="center" customStyle={{
          opacity: .35,
        }} />
        <Spacer size="small" />
        {
          crumbs &&
          crumbs.map(crumb => {
            console.log("crumb: ", crumb)
            return (
              <CrumbSharedItem key={crumb.id} crumb={crumb} />
            )
          })
        }
        <PreviewBunch />
      </ScrollView>
      <View
        style={[styles.header, {
          top: 0,
          paddingTop: topPadding,
          paddingBottom: 5,
          backgroundColor: bgCol,
          elevation: 5,
          shadowOffset: { height: 0, width: 0 },
          shadowOpacity: .1,
          shadowRadius: 5,
        }]}
        onLayout={e => {
          setHeaderHeight(e.nativeEvent.layout.height)
        }}
      >
        <CustomButton
          freed
          type="text"
          customStyle={{
            width: 50,
            height: 50,
          }}
          handleClick={handleGoBack}
        >
          <ChevronLeftIcon stroke={textCol} strokeWidth={3.5} size={23} />
        </CustomButton>
        <View
          style={[styles.userDetails, {

          }]}
        >
          <CustomProfilePictureCircle userId={userid} size={40} />
          <Spacer size="small" />
          <CustomLabel allowTruncate bold fontSize={18} adaptToTheme labelText={displayName} customStyle={{
            color: textCol
          }} />
        </View>

        <CustomButton
          freed
          type="text"
          customStyle={{
            width: 50,
            height: 50,
          }}
        >
          <MoreHorizontalIcon stroke={textCol} strokeWidth={2} size={27} />
        </CustomButton>
      </View>

      <CustomButton
        freed
        type="less-prominent"
        customStyle={{
          position: "absolute",
          width: 60,
          height: 60,
          bottom: 25 + insets.bottom,
          right: 25,
          elevation: 5,
          shadowColor: "black",
          shadowOffset: { height: 1, width: 1 },
          shadowOpacity: .25,
          shadowRadius: 10,
        }}
      >
        <PlusIcon stroke="white" strokeWidth={3.5} />
      </CustomButton>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  userDetails: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    flexGrow: 1,
    flexShrink: 1,
  }
})