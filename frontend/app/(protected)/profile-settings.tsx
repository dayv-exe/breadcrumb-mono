import { DeleteLocalDatabase, logAllTable } from "@/api/db/InitDb";
import { extractBackendMsg } from "@/api/models/apiResponse";
import { useBottomSheet } from "@/components/bottomsheet/BottomSheetContext";
import CustomButton from "@/components/buttons/CustomButton";
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
import { ElevatedSectionedScrollView, Section } from "@/components/views/ElevatedSectionedScrollView";
import { MediaData } from "@/constants/media";
import { useDeleteUser, useGetUser, useUpdateProfilePicture } from "@/hooks/queries/useUserApi";
import { useEmailVerificationStatus } from "@/hooks/useCognitoEmail";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import { useImagePicker } from "@/hooks/useImagePicker";
import { useMediaUpload } from "@/hooks/useMediaUpload";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuthStore } from "@/utils/authStore";
import * as ImageManipulator from "expo-image-manipulator";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

type SettingOption = {
  name: string
  value: string
  handleClick?: () => void
}

const OptionItem = ({ name, value, handleClick }: SettingOption) => {
  return (
    <TouchableOpacity style={{
      minHeight: 60,
      flexDirection: "column",
      alignItems: "flex-start",
      justifyContent: "center",
      paddingHorizontal: 10,
      paddingVertical: 10
    }} onPress={() => handleClick?.()}>
      <CustomLabel padding={0} adaptToTheme labelText={name} fade={value ? true : false} fontSize={value ? 14 : 15} />
      <Spacer size="tiny" />
      {value && <CustomLabel padding={0} adaptToTheme labelText={value} />}
    </TouchableOpacity>
  )
}

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

export default function ProfileSettingsScreen() {
  const { logout } = useAuthStore()
  const {
    userid,
  } = useLocalSearchParams<{ userid: string }>()
  const { data: user, error: userError, isPending: userPending } = useGetUser(userid ?? "")
  const { mutate: delAccount, error: delAccountError, isPending: delAccountPending } = useDeleteUser()
  const fadedBgColor = useThemeColor({}, "fadedBackground")
  const bgCol = useThemeColor({}, "background")
  const darkBg = useThemeColor({}, "darkBackground")
  const mode = useColorScheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()

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
    DeleteLocalDatabase(
      () => {
        delAccount(undefined, {
          onError: err => {
            Toast.show({
              type: "info",
              text1: err.message,
              position: "top",
            })
          },
        })
      },
      e => {
        Toast.show({
          type: "info",
          text1: e as any,
          position: "top",
        })
      },
    )
  }

  const handleLogout = async () => {
    logout()
  }

  const handleOptClick = (title: string, child: React.JSX.Element) => {
    openSheet({
      content: (
        <View style={[styles.bottomsheet, { top: insets.top }]}>
          <View style={styles.sheetheader}>
            <View>
              <CustomLabel adaptToTheme bold labelText={title} padding={0} />
              <Spacer size="small" />
            </View>
            <CustomButton customTextStyle={{ color: "red" }} customStyle={{ position: "absolute", top: 0, right: 0, padding: 0 }} labelText="cancel" type="less-vibrant-text" handleClick={closeSheet} />
          </View>
          {child}
        </View>
      ),
      snapPoints: ["100%"],
      showHandle: false,
      reduceAnimations: true
    })
  }

  const { openSheet, closeSheet } = useBottomSheet()

  const sections: Section[] = [
    {
      type: "static",
      key: "account info",
      title: "👤 Account Information",
      keyExtractor: (opt: SettingOption) => opt.name,
      data: [
        {
          name: 'Username', value: user?.nickname ?? "", handleClick: () => {
            handleOptClick("Edit username",
              <EditUsername allowNicknameChange={user?.allowNicknameChange ?? true} onUpdate={() => {
                closeSheet()
              }} oldUsername={user?.nickname ?? ""} />
            )
          }
        },
        {
          name: "Name", value: user?.name ?? "", handleClick: () => {
            handleOptClick("Update name",
              <EditName allowNameChange={user?.allowNameChange ?? true} onUpdate={() => {
                closeSheet()
              }} oldName={user?.name ?? ""} />
            )
          }
        },
        {
          name: 'Bio', value: user?.bio ?? "", handleClick: () => {
            handleOptClick("Update bio",
              <EditBio oldBio={user?.bio ?? ""} onUpdate={() => {
                closeSheet()
              }} />
            )
          }
        },
        {
          name: emailOptText, value: user?.email ?? "", handleClick: () => {
            handleOptClick("Update email",
              <EditEmail oldEmail={user?.email ?? ""} onUpdate={() => {
                closeSheet()
              }} />
            )
          }
        },
        {
          name: "Password", value: "****", handleClick: () => {
            handleOptClick("Change password",
              <EditPassword onUpdate={() => {
                closeSheet()
              }} />
            )
          }
        },
        {
          name: "Birthdate", value: user?.birthdate ?? "", handleClick: () => {
            handleOptClick("Update birthdate",
              <EditBirthdate onUpdate={() => {
                closeSheet()
              }} />
            )
          }
        },
      ],
      renderItem: (opt: SettingOption) => (
        <OptionItem name={opt.name} value={opt.value} handleClick={opt.handleClick} />
      )
    },
    {
      type: "static",
      key: "privacy",
      title: '🔐 Privacy',
      keyExtractor: (opt: SettingOption) => opt.name,
      data: [
        {
          name: 'Blocked users', value: "", handleClick: () => {
            handleOptClick("Blocked users",
              <View>
                <CustomLabel adaptToTheme labelText="List of blocked users" />
              </View>
            )
          }
        },
        { name: "Logout", value: "", handleClick: handleLogout },
        { name: 'Delete account', value: "", handleClick: handleDelAccount },
        { name: 'Bug report', value: "" },
      ],
      renderItem: (opt: SettingOption) => (
        <OptionItem name={opt.name} value={opt.value} handleClick={opt.handleClick} />
      )
    },
    {
      type: "static",
      key: "legal",
      title: '📖 Other',
      keyExtractor: (opt: SettingOption) => opt.name,
      data: [
        { name: 'Privacy policy', value: "" },
        //{ name: 'Contact us', value: "" },
      ],
      renderItem: (opt: SettingOption) => (
        <OptionItem name={opt.name} value={opt.value} handleClick={opt.handleClick} />
      )
    },
    {
      type: "static",
      key: "devtools",
      title: '👾 Developer tools',
      keyExtractor: (opt: SettingOption) => opt.name,
      data: [
        {
          name: 'Log local crumbs', value: "", handleClick: () => {
            Toast.show({
              text1: "Logging local db...",
              type: "info",
            })
            logAllTable("crumbs")
          }
        },
        {
          name: 'Log local places', value: "", handleClick: () => {
            Toast.show({
              text1: "Logging local db...",
              type: "info",
            })
            logAllTable("places")
          }
        },
        {
          name: 'Delete local db', value: "", handleClick: () => {
            Toast.show({
              text1: "Deleting local db...",
              type: "info",
            })
            DeleteLocalDatabase(() => {
              console.log("deleted db")
            })
          }
        },
      ],
      renderItem: (opt: SettingOption) => (
        <OptionItem name={opt.name} value={opt.value} handleClick={opt.handleClick} />
      )
    },
    {
      type: "raw",
      component: (
        <View style={{
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          paddingTop: 15,
        }}>
          <CustomLabel width="auto" labelText="❤️" fontSize={13} padding={0} customStyle={{ marginRight: 3 }} />
          <CustomLabel padding={0} width="auto" fontSize={13} adaptToTheme labelText="undergrad diss proj by david arubuike" customStyle={{ opacity: .6 }} />
        </View>
      ),
      key: "raw",
    },
  ]

  const { showModal, hideModal } = useModal()
  const { pickFromGallery, takePhoto, isLoading } = useImagePicker()
  const { mutate: updateProfilePictureKey, isError, error } = useUpdateProfilePicture()
  const { upload } = useMediaUpload({
    onSuccess(file) {
      if (isError || !file[0].media?.mediaKey) {
        showModal({
          message: extractBackendMsg(error),
          onPrimary: hideModal,
          primaryBtnText: "Ok"
        })
        return
      }

      updateProfilePictureKey({
        imageKey: file[0].media.mediaKey,
        thumbnailKey: file[0].thumbnail!.mediaKey
      }, {
        onSuccess() {

        },
        onError(e) {
          showModal({
            message: extractBackendMsg(e),
            primaryBtnText: "Close",
            onPrimary: hideModal
          })
        }
      })
    },
    onError(e) {
      showModal({
        message: extractBackendMsg(e),
        onPrimary: hideModal,
        primaryBtnText: "Ok"
      })
    }

  })

  const handlePressChangePic = () => {
    openSheet({
      content: (
        <View style={{ paddingBottom: insets.bottom }}>
          <CustomButton type="text" labelText="Choose from photos" adaptToTheme handleClick={() => {
            pickFromGallery({ mediaTypes: ["images"], onPictureChosen: image => handleChangePic(image) }, false)
          }} />
          <CustomButton type="text" labelText="Take photo" adaptToTheme handleClick={() => {
            takePhoto({
              aspect: [1, 1], onPictureChosen: image => {
                handleChangePic(image)
              }
            })
          }} />
          <CustomButton type="text" labelText="Remove" customTextStyle={{ color: "red" }} adaptToTheme handleClick={handleDeletePic} />
        </View>
      ),
      dynamicHeight: true,
    })
  }

  const handleChangePic = async (image: MediaData) => {
    // crop to a centered square first
    const size = Math.min(image.width!, image.height!)
    const originX = (image.width! - size) / 2
    const originY = (image.height! - size) / 2

    const context = ImageManipulator.ImageManipulator
      .manipulate(image.localUri)
      .crop({ originX, originY, width: size, height: size })

    const original = (await context.renderAsync()).saveAsync({ compress: .8 })
    const thumbnail = (await context.resize({ width: 200, height: 200 }).renderAsync()).saveAsync({ compress: .8 })
    await upload([{
      id: "",
      localUri: (await original).uri,
      thumbnailUri: (await thumbnail).uri,
      type: "profilePhoto",
      resizeMode: "contain",
      uploadState: { pending: false, uploadUrl: "", error: null }
    }])
    closeSheet()
  }

  const handleDeletePic = () => {
    updateProfilePictureKey({
      imageKey: "",
      thumbnailKey: "",
    }, {
      onSuccess() {

      },
      onError() {
        showModal({
          message: "Failed to update profile picture, try again.",
          primaryBtnText: "Close",
          onPrimary: hideModal
        })
      }
    })

    closeSheet()
  }

  return (
    <>
      {userPending &&
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
      {!userPending && !userError && user && <CustomView horizontalPadding={0} backgroundColor={darkBg}>
        <CustomHeader title="Edit profile" handleBack={() => {
          router.dismiss()
        }} />
        <Spacer size="small" />
        <View style={[
          styles.container,
        ]}>
          <View style={{
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <CustomProfilePictureCircle userId={user?.userId} nickname={user?.nickname}
              handleClick={handlePressChangePic}
            />
            <CustomButton handleClick={handlePressChangePic} bold={false} labelText="Tap to change" type="text" adaptToTheme />
          </View>
          <Spacer />
          <ElevatedSectionedScrollView sections={sections} style={{
            flex: 1,
            width: "100%",
          }} />
        </View>
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
    width: "100%",
    flexDirection: "column",
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
    width: "90%",
  },
  optionTouchable: {
    width: "100%",
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
  },
  bottomsheet: {
    paddingHorizontal: 20
  },
  sheetheader: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  }
})