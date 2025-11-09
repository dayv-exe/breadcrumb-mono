import { useBottomSheet } from "@/components/bottomsheet/BottomSheetContext";
import CustomButton from "@/components/buttons/CustomButton";
import CustomImageButton from "@/components/buttons/CustomImageButton";
import CustomLabel from "@/components/CustomLabel";
import { useModal } from "@/components/modals/ModalContext";
import CustomProfilePictureCircle from "@/components/profile/CustomProfilePictureCircle";
import EditBio from "@/components/profile/EditBio";
import EditBirthdate from "@/components/profile/EditBirthdate";
import EditEmail from "@/components/profile/EditEmail";
import EditName from "@/components/profile/EditName";
import EditPassword from "@/components/profile/EditPassword";
import EditUsername from "@/components/profile/EditUsername";
import Spacer from "@/components/Spacer";
import CustomHeader from "@/components/views/CustomHeader";
import CustomView from "@/components/views/CustomView";
import { Colors } from "@/constants/Colors";
import { useDeleteUser, useGetUser } from "@/hooks/queries/useUserApi";
import { useEmailVerificationStatus } from "@/hooks/useCognitoEmail";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import { useImagePicker } from "@/hooks/useImagePicker";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuthStore } from "@/utils/authStore";
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import { BottomSheetDefaultBackdropProps } from "@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, SectionList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
  BIRTHDATE,
  EMPTY
}

export default function ProfileSettingsScreen() {
  const { logout } = useAuthStore()
  const {
    userid,
  } = useLocalSearchParams<{ userid: string }>()
  const { data: user, error, isFetching: isPending, refetch } = useGetUser(userid)
  const { mutate: delAccount } = useDeleteUser()
  const fadedBgColor = useThemeColor({}, "fadedBackground")
  const bgCol = useThemeColor({}, "background")
  const mode = useColorScheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [bottomSheetChild, setBottomSheetChild] = useState<EditMode>(EditMode.USERNAME)
  const [renderSheet, setRenderSheet] = useState(false)

  const [emailOptText, setEmailOptText] = useState("Email")
  const { emailVerificationStatus } = useEmailVerificationStatus()

  async function getEmailOptText() {
    const { verified } = await emailVerificationStatus()
    if (!verified) {
      setEmailOptText("Email (UNCONFIRMED)")
    }
  }

  useEffect(() => {
    getEmailOptText()
  }, [])

  const handleDeleteAccount = () => {
    router.push("/deleteAccount")
  }

  const handleDelAccount = () => {
    delAccount(undefined, {
      onSuccess: res => {
        if (res.error) {
          Toast.show({
            type: "info",
            text1: res.error,
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

  const { openSheet, closeSheet } = useBottomSheet()

  const sections = [
    {
      title: '👤 Account Information', data: [
        {
          name: 'Username', value: user?.message?.nickname ?? "", handleClick: () => {
            openSheet({
              content: (
                <View style={{  }}>
                  <View style={{width: "100%", display: "flex", alignItems: "center", justifyContent: "flex-start", flexDirection: "row"}}>
                    <CustomButton paddingHorizontal={0} handleClick={handleCloseDrawer} type="less-vibrant-text" labelText="Cancel"/>
                  </View>
                  <EditUsername lastNicknameChange={user?.message?.lastNicknameChange ?? ""} onUpdate={() => {
                    closeSheet()
                    refetch()
                  }} oldUsername={user?.message?.nickname ?? ""} />
                </View>
              ),
              snapPoints: ["100%"],
              showHandle: false,
              reduceAnimations: true
            })
          }
        },
        {
          name: "Name", value: user?.message?.name ?? "", handleClick: () => {
            setBottomSheetChild(EditMode.FULLNAME)
            handleOpenDrawer()
          }
        },
        {
          name: 'Bio', value: user?.message?.bio ?? "", handleClick: () => {
            setBottomSheetChild(EditMode.BIO)
            handleOpenDrawer()
          }
        },
        {
          name: emailOptText, value: user?.message?.email ?? "", handleClick: () => {
            setBottomSheetChild(EditMode.EMAIL)
            handleOpenDrawer()
          }
        },
        {
          name: "Password", value: "****", handleClick: () => {
            setBottomSheetChild(EditMode.PASSWORD)
            handleOpenDrawer()
          }
        },
        {
          name: "Birthdate", value: user?.message?.birthdate ?? "", handleClick: () => {
            setBottomSheetChild(EditMode.BIRTHDATE)
            handleOpenDrawer()
          }
        },
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
  const { showModal, hideModal } = useModal()
  const { pickFromGallery, takePhoto, image, isLoading } = useImagePicker()

  return (
    <>
      {isPending &&
        <View style={{
          flex: 1,
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: bgCol
        }}>
          <ActivityIndicator />
        </View>
      }
      {!isPending && !error && user && !user.error && <CustomView horizontalPadding={0} adaptToTheme>
        <CustomHeader title="Edit profile" handleBack={() => {
          router.dismiss()
        }} />
        <Spacer />
        <View style={[
          styles.container,
        ]}>
          <CustomProfilePictureCircle nickname={user.message?.nickname}
            handleClick={async () => {
              await showModal({
                message: "Change profile picture",
                primaryBtnText: "Choose from photos",
                secondaryBtnText: "Take photo",
                onPrimary: () => {
                  pickFromGallery({ mediaTypes: ["images"], onPictureChosen: () => hideModal() })
                },
                onSecondary: () => takePhoto({ aspect: [1, 1] }),
                showCancelBtn: true
              })
            }}
          />
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
          onClose={() => {
            setRenderSheet(false)
          }}
          backdropComponent={renderBackdrop}
        >
          <BottomSheetView style={{ marginHorizontal: 20 }}>
            <View style={[styles.header, {
              marginTop: insets.top,
            }]}>
              <CustomButton paddingHorizontal={0} handleClick={handleCloseDrawer} type="less-vibrant-text" labelText="Cancel" customStyle={{
                position: "absolute",
                left: 0
              }} />
              <CustomLabel adaptToTheme width={"auto"} bold textAlign="center" labelText={
                bottomSheetChild === EditMode.USERNAME ? "Edit username" :
                  bottomSheetChild === EditMode.FULLNAME ? "Edit Name" :
                    bottomSheetChild === EditMode.BIO ? "Edit bio" :
                      bottomSheetChild === EditMode.BIRTHDATE ? "Edit birthdate" :
                        bottomSheetChild === EditMode.EMAIL ? "Edit email" :
                          bottomSheetChild === EditMode.PASSWORD ? "Change password" : ""
              } />
            </View>
            <Spacer />
            {
              renderSheet && bottomSheetChild === EditMode.FULLNAME &&
              <EditName lastNameChangeDate={user.message?.lastNameChange ?? ""} onUpdate={() => {
                handleCloseDrawer()
                refetch()
              }} oldName={user.message?.name ?? ""} />
            }
            {
              renderSheet && bottomSheetChild === EditMode.BIO &&
              <EditBio oldBio={user.message?.bio ?? ""} onUpdate={() => {
                refetch()
                handleCloseDrawer()
              }} />
            }
            {
              renderSheet && bottomSheetChild === EditMode.BIRTHDATE &&
              <EditBirthdate onUpdate={() => {
                handleCloseDrawer()
                refetch()
              }} />
            }
            {
              renderSheet && bottomSheetChild === EditMode.EMAIL &&
              <EditEmail onUpdate={() => {
                refetch()
                handleCloseDrawer()
              }} oldEmail={user.message?.email ?? ""} />
            }
            {
              renderSheet && bottomSheetChild === EditMode.PASSWORD &&
              <EditPassword onUpdate={() => {
                handleCloseDrawer()
              }} />
            }
          </BottomSheetView>
        </BottomSheet>
      </CustomView>}
    </>
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