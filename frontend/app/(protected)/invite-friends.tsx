import CustomButton from "@/components/buttons/CustomButton";
import CustomLabel from "@/components/CustomLabel";
import Spacer from "@/components/Spacer";
import CustomView from "@/components/views/CustomView";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import { useThemeColor } from "@/hooks/useThemeColor";
import { showSettingsAlert } from "@/utils/helpers";
import * as Contacts from "expo-contacts";
import { useEffect, useState } from "react";
import { FlatList, Image, Linking, ListRenderItem, Platform, StyleSheet, TextInput, View } from "react-native";

const icons = {
  search: {
    light: require("../../assets/images/icons/search_unsel_light.png"),
    dark: require("../../assets/images/icons/search_unsel_dark.png")
  },
}

export function getIconImage(name: keyof typeof icons, darkMode: boolean) {
  const theme = darkMode ? "dark" : "light"
  return icons[name][theme]
}

const renderContact: ListRenderItem<Contacts.Contact> = ({ item }) => {
  return <View style={{
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingVertical: 5
  }}>
    <View style={{
      flexShrink: 1,
      flexDirection: "row"
    }}>
      <CustomLabel
        labelText={item.name ?? "Unnamed Contact"}
        key={`${item.phoneNumbers}-${item.name}`}
        width="auto"
        adaptToTheme
      />
    </View>

    <View>
      <CustomButton labelText="Invite" type="theme-faded" slim paddingHorizontal={20} />
    </View>

  </View>
};

export default function InviteFriends() {
  const [contacts, setContacts] = useState<Contacts.Contact[]>()
  const [searchStr, setSearchStr] = useState("")
  const [permGranted, setPermGranted] = useState(false)
  const [contactAccess, setContactAccess] = useState<"all" | "limited" | "none" | undefined>()
  const mode = useColorScheme()
  const theme = useThemeColor

  async function getContacts() {
    const { granted, accessPrivileges } = await Contacts.requestPermissionsAsync();
    if (granted) {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name],
      });
      setContacts(data)
      setPermGranted(true)
    } else {
      setPermGranted(false)
      showSettingsAlert("Contacts")
    }

    setContactAccess(accessPrivileges)
  }

  useEffect(() => {
    getContacts()
  }, [])

  return (
    <CustomView adaptToTheme horizontalPadding={20}>
      <Spacer size="small" />
      <View style={[styles.searchInputContainer, { backgroundColor: theme({}, "fadedBackground") }]}>
        <Image style={styles.searchInputImg} source={getIconImage("search", mode === "light")} />
        <TextInput autoCorrect={false} autoCapitalize="none" autoComplete="off" style={[styles.searchInput, { padding: 0, color: theme({}, "text") }]} onChangeText={e => setSearchStr(e)}>
          {searchStr}
        </TextInput>
      </View>
      <Spacer />
      {contacts && contacts.length > 0 && <FlatList
        data={contacts}
        renderItem={renderContact}
        ItemSeparatorComponent={() => <Spacer />}
        maxToRenderPerBatch={5}
        initialNumToRender={5}
        style={{
          width: "100%",
          maxHeight: "100%",
        }}
      />}
      {!permGranted && <View style={{ alignItems: "center", justifyContent: "center" }}>
        <CustomLabel adaptToTheme textAlign="center" labelText="🔐" fontSize={21} />
        <CustomLabel adaptToTheme width={"80%"} labelText={`Allow access to your contacts to invite friends.`} textAlign="center" />
        <CustomButton adaptToTheme type="less-vibrant-text" labelText="Grant Permissions" handleClick={getContacts} />
      </View>}
      {permGranted && contactAccess !== "all" && Platform.OS === "ios" && <View style={{ alignItems: "center", justifyContent: "center", width: "100%" }}>
        <CustomLabel adaptToTheme textAlign="center" labelText="🔐" fontSize={21} />
        <CustomLabel adaptToTheme width={"80%"} fade italic labelText={`Allow unlimited access to contacts in settings to see more.`} textAlign="center" />
        <CustomButton type="less-vibrant-text" labelText="settings" handleClick={() => Linking.openSettings()} />
        <Spacer />
      </View>}
    </CustomView>
  )
}

const styles = StyleSheet.create({
  searchInput: {
    flexGrow: 1,
    color: "fff",
    marginHorizontal: 5,
    fontSize: 17
  },
  searchInputContainer: {
    flexDirection: "row",
    width: "100%",
    color: "fff",
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    padding: 15
  },
  searchInputImg: {
    width: 15,
    height: 15,
  }
})