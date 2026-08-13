import CustomButton from "@/components/buttons/CustomButton";
import CrumbView from "@/components/crumbs/CrumbView";
import CustomLabel from "@/components/CustomLabel";
import CustomProfilePictureCircle from "@/components/profile/CustomProfilePictureCircle";
import Spacer from "@/components/Spacer";
import { Colors } from "@/constants/Colors";
import { UseGetAddress } from "@/hooks/useGetAddress";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useMediaStore } from "@/utils/mediaStore";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { ChevronLeftIcon, Trash2Icon } from "lucide-react-native";
import { useRef } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useShallow } from "zustand/shallow";

export default function Preview() {
  const bgCol = useThemeColor({}, "background")
  const insets = useSafeAreaInsets()
  const { address } = UseGetAddress()
  const { mediaPreview, discardAllMedia } = useMediaStore(useShallow(s => ({
    mediaPreview: s.mediaPreview,
    discardAllMedia: s.discardAllMediaPreview,
  })))
  const bottomSheetRef = useRef(null)
  const handleCol = Colors.dark.text
  const darkBgCol = Colors.dark.background

  const nav = useRouter()

  function handleGoBack() {
    nav.back()
  }

  function handleDiscardAllMedia() {
    discardAllMedia()
    nav.back()
  }

  return (
    <View
      style={[styles.container, {
        backgroundColor: "black",
        paddingTop: insets.top,
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
          handleClick={handleGoBack}
        >
          <ChevronLeftIcon stroke={"white"} strokeWidth={3.5} size={25} />
        </CustomButton>
        <CustomLabel
          bold
          width="auto"
          labelText={"Share crumbs"}
          padding={0}
          fontSize={18}
        />
        {<CustomButton
          type="text"
          customStyle={{
            position: "absolute",
            right: 0,
            padding: 0,
          }}

          handleClick={handleDiscardAllMedia}
        >
          <Trash2Icon stroke={"red"} strokeWidth={2.5} size={20} />
          <CustomLabel bold labelText={`(${mediaPreview.length})`} fontSize={13} textColor="red" padding={0} />
        </CustomButton>}
      </View>

      <ScrollView
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        horizontal
        style={{
          position: "absolute",
          top: "17%",
          paddingHorizontal: 15,
        }}
      >
        {mediaPreview.map((media, index) => {
          return (
            <CrumbView
              imageUri={media.uri}
              key={media.id}
              style={{
                marginRight: 10
              }}
            />
          )
        })}
      </ScrollView>

      <BottomSheet
        ref={bottomSheetRef}
        enableDynamicSizing
        enableOverDrag
        enableContentPanningGesture
        enableHandlePanningGesture
        enableBlurKeyboardOnGesture
        animationConfigs={{
          stiffness: 500,
          damping: 20,
          mass: 0.5,
        }}
        containerStyle={{
          zIndex: 1000,
        }}
        snapPoints={["30%"]}
        backgroundStyle={{

          elevation: 10,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: .375,
          shadowRadius: 15,

          backgroundColor: darkBgCol,
          borderTopLeftRadius: 25,
          borderTopRightRadius: 25,
        }}
        handleIndicatorStyle={{
          opacity: .9,
          backgroundColor: handleCol
        }}
      >

        <BottomSheetView>
          <View
            style={{
              padding: 15,
            }}
          >
            <CustomLabel
              labelText="Share with"
              bold
              fontSize={16}
            />
            <Spacer size="small" />
            <CustomProfilePictureCircle size={55} />
          </View>
        </BottomSheetView>

      </BottomSheet>
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
    left: 0,
  }
})