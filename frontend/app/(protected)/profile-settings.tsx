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
import { generateThumbnail } from "@/utils/thumbnailGen";
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
      alignItems: "center",
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
  const { data: user, error, isFetching: isPending } = useGetUser(userid)
  const { mutate: delAccount } = useDeleteUser()
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
          name: 'Username', value: user?.message?.nickname ?? "", handleClick: () => {
            handleOptClick("Edit username",
              <EditUsername allowNicknameChange={user?.message?.allowNicknameChange ?? true} onUpdate={() => {
                closeSheet()
              }} oldUsername={user?.message?.nickname ?? ""} />
            )
          }
        },
        {
          name: "Name", value: user?.message?.name ?? "", handleClick: () => {
            handleOptClick("Update name",
              <EditName allowNameChange={user?.message?.allowNameChange ?? true} onUpdate={() => {
                closeSheet()
              }} oldName={user?.message?.name ?? ""} />
            )
          }
        },
        {
          name: 'Bio', value: user?.message?.bio ?? "", handleClick: () => {
            handleOptClick("Update bio",
              <EditBio oldBio={user?.message?.bio ?? ""} onUpdate={() => {
                closeSheet()
              }} />
            )
          }
        },
        {
          name: emailOptText, value: user?.message?.email ?? "", handleClick: () => {
            handleOptClick("Update email",
              <EditEmail oldEmail={user?.message?.email ?? ""} onUpdate={() => {
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
          name: "Birthdate", value: user?.message?.birthdate ?? "", handleClick: () => {
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
          name: 'Blocked Users', value: "", handleClick: () => {
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
      title: '📖 Legal',
      keyExtractor: (opt: SettingOption) => opt.name,
      data: [
        { name: 'Term of service', value: "" },
        { name: 'Contact us', value: "" },
      ],
      renderItem: (opt: SettingOption) => (
        <OptionItem name={opt.name} value={opt.value} handleClick={opt.handleClick} />
      )
    },
  ]

  const { showModal, hideModal } = useModal()
  const { pickFromGallery, takePhoto, isLoading } = useImagePicker()
  const { mutate: updateProfilePictureKey, isError } = useUpdateProfilePicture()
  const { upload } = useMediaUpload({
    onSuccess(file) {
      if (isError || !file[0].media?.mediaKey) {
        showModal({
          message: "Failed to change profile picture, try again!",
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
        onError() {
          showModal({
            message: "Failed to update profile picture, try again.",
            primaryBtnText: "Close",
            onPrimary: hideModal
          })
        }
      })
    },
    onError() {
      showModal({
        message: "Failed to change profile picture, try again!",
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
          <CustomButton type="text" labelText="Delete" customTextStyle={{ color: "red" }} adaptToTheme handleClick={handleDeletePic} />
        </View>
      ),
      dynamicHeight: true,
    })
  }

  const handleChangePic = async (image: MediaData) => {
    image.thumbnail = await generateThumbnail(image.uri, "image")
    await upload([{ index: 0, media: image.uri, type: "profilePhoto", thumbnail: image.thumbnail }])
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
      {!isPending && !error && user && !user.error && <CustomView horizontalPadding={0} backgroundColor={darkBg}>
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
            <CustomProfilePictureCircle userId={user.message?.userId} nickname={user.message?.nickname}
              handleClick={handlePressChangePic}
            />
            <CustomButton handleClick={handlePressChangePic} labelText="Tap to change" type="text" adaptToTheme />
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