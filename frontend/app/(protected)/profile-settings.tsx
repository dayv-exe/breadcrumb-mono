import CustomButton from "@/components/buttons/CustomButton";
import CustomImageButton from "@/components/buttons/CustomImageButton";
import CustomLabel from "@/components/CustomLabel";
import CustomProfilePictureCircle from "@/components/profile/CustomProfilePictureCircle";
import EditUsername from "@/components/profile/EditUsername";
import Spacer from "@/components/Spacer";
import CustomHeader from "@/components/views/CustomHeader";
import CustomView from "@/components/views/CustomView";
import { Colors } from "@/constants/Colors";
import { useDeleteAccount } from "@/hooks/queries/useDeleteAccount";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuthStore } from "@/utils/authStore";
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import { BottomSheetDefaultBackdropProps } from "@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { SectionList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const icons = {
  next: {
    light: require("../../assets/images/icons/next_sel_light.png"),
    dark: require("../../assets/images/icons/next_sel_dark.png")
  },
  back: {
    light: require("../../assets/images/icons/back_sel_light.png"),
    dark: require("../../assets/images/icons/back_sel_dark.png")
  },
}

function getIconImage(name: keyof typeof icons, darkMode: boolean) {
  const theme = darkMode ? "dark" : "light"
  return icons[name][theme]
}

enum EditMode {
  USERNAME,
  FULLNAME,
  BIO,
  EMAIL,
  PASSWORD,
  BIRTHDATE
}

export default function ProfileSettingsScreen() {
  const { logout } = useAuthStore()
  const {
    userid,
    dpUrl,
    defaultPicColors,
    nickname,
    name,
    bio,
    email,
    birthdate,
  } = useLocalSearchParams<{ userid: string, dpUrl: string, defaultPicColors: string, nickname: string, name: string, bio: string, email: string, birthdate: string }>()
  const { mutate: delAccount } = useDeleteAccount()
  const fadedBgColor = useThemeColor({}, "fadedBackground")
  const bgCol = useThemeColor({}, "background")
  const mode = useColorScheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [bottomSheetChild, setBottomSheetChild] = useState<EditMode>(EditMode.USERNAME)
  const [renderSheet, setRenderSheet] = useState(false)

  const handleDeleteAccount = () => {
    router.push("/deleteAccount")
  }

  const handleDelAccount = () => {
    delAccount("", {
      onSuccess: res => {
        if (!res.successful) {
          Toast.show({
            type: "info",
            text1: res.reason,
            position: "top",
          })
        } else {
          logout()
        }
      }
    })
  }

  const handleLogout = () => {
    logout()
  }

  const sections = [
    {
      title: '👤 Account Information', data: [
        {
          name: 'Username', value: nickname, handleClick: () => {
            handleOpenDrawer()
          }
        },
        { name: "Full name", value: name },
        { name: 'Bio', value: bio },
        { name: "Email", value: email },
        { name: "Password", value: "****" },
        { name: "Birthdate", value: birthdate },
      ]
    },
    {
      title: '🔐 Privacy', data: [
        { name: 'Blocked Users', value: "" },
        { name: "Logout", value: "", handleClick: handleLogout },
        { name: 'Delete account', value: "", handleClick: handleDelAccount },
        { name: 'Bug report', value: "" },
      ]
    },
    {
      title: '📖 Legal', data: [
        { name: 'Term of service', value: "" },
        { name: 'Contact us', value: "" },
      ]
    },
  ];

  function handleCloseDrawer() {
    bottomSheetRef.current?.close()
  }

  function handleOpenDrawer() {
    setRenderSheet(true)
    bottomSheetRef.current?.snapToIndex(1)
  }

  const renderBackdrop = useCallback(
    (props: BottomSheetDefaultBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );


  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['100%'], []);

  return (
    <CustomView horizontalPadding={0} adaptToTheme>
      <CustomHeader title="Edit profile" handleBack={() => {
        router.dismiss()
      }} />
      <Spacer />
      <View style={[
        styles.container,
      ]}>
        <CustomProfilePictureCircle showInstruction />
        <Spacer />
        <SectionList
          style={styles.sections}
          sections={sections}
          keyExtractor={(item, index) => item.name + index}
          renderItem={({ item }) => (
            <View style={[styles.item, { borderBottomColor: fadedBgColor }]}>
              <TouchableOpacity onPress={item.handleClick ? item.handleClick : () => { }} style={styles.optionTouchable}>
                <View>
                  <CustomLabel fitContent adaptToTheme fade labelText={item.name} />
                  {item.value && <CustomLabel fitContent adaptToTheme labelText={item.value} />}
                </View>
                <CustomImageButton flat src={getIconImage("next", mode === "light")} />
              </TouchableOpacity>
            </View>
          )}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={[styles.sectionHeader, {
              backgroundColor: mode === "dark" ? Colors.dark.background : Colors.light.background,
              color: mode === "dark" ? Colors.dark.text : Colors.light.text
            }]}>{title}</Text>
          )}
        />
        <Spacer />
      </View>
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        backgroundStyle={[styles.bottomsheet, {
          backgroundColor: bgCol
        }]}
        handleStyle={{ display: "none" }}
        onChange={i => {
          if (i < 1) {
            handleCloseDrawer()
          }
        }}
        onClose={() => setRenderSheet(false)}
        backdropComponent={renderBackdrop}
      >
        <BottomSheetView style={{ marginHorizontal: 20 }}>
          <View style={[styles.header, {
            marginTop: insets.top,
          }]}>
            <CustomButton handleClick={handleCloseDrawer} type="less-vibrant-text" labelText="Cancel" customStyle={{
              position: "absolute",
              left: 0
            }} />
            <CustomLabel adaptToTheme width={"auto"} bold textAlign="center" labelText={
              bottomSheetChild === EditMode.USERNAME ? "Edit username" : ""
            } />
          </View>
          <Spacer  />
          {renderSheet && bottomSheetChild === EditMode.USERNAME &&
            <EditUsername oldUsername={nickname} />
          }
        </BottomSheetView>
      </BottomSheet>
    </CustomView>
  )
}

const styles = StyleSheet.create({
  header: {
    position: "relative",
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%"
  },
  sectionHeader: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    fontWeight: 'bold',
    fontSize: 17,
  },
  item: {
    width: "90%",
    paddingVertical: 10,
    borderBottomWidth: .5,
    alignSelf: "center"
  },
  sections: {
    width: "100%",
  },
  optionTouchable: {
    width: "100%",
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
  },
  bottomsheet: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
})