import { UserDetails } from "@/api/models/userDetails";
import CustomButton from "@/components/buttons/CustomButton";
import CustomLabel from "@/components/CustomLabel";
import CustomSearchInput from "@/components/inputs/CustomSearchInput";
import ProfileItem from "@/components/profile/ProfileItem";
import ProfileItemSkeleton from "@/components/profile/ProfileItemSkeleton";
import Spacer from "@/components/Spacer";
import CustomView from "@/components/views/CustomView";
import ElevatedView from "@/components/views/ElevatedView";
import SunkenView from "@/components/views/SunkenView";
import { MAX_SEARCH_STRING_CHARS } from "@/constants/appConstants";
import { useSearchUserApi } from "@/hooks/queries/useUserApi";
import { debounce } from "@/utils/debounce";
import { showSettingsAlert } from "@/utils/helpers";
import { useIsFocused } from "@react-navigation/native";
import * as Contacts from "expo-contacts";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { FlatList, ListRenderItem, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";


const icons = {
  search: {
    light: require("../../../assets/images/icons/search_unsel_light.png"),
    dark: require("../../../assets/images/icons/search_unsel_dark.png")
  },
  addFriends: {
    light: require("../../../assets/images/icons/findfriends_sel_light.png"),
    dark: require("../../../assets/images/icons/findfriends_sel_dark.png")
  }
}

export function getIconImage(name: keyof typeof icons, darkMode: boolean) {
  const theme = darkMode ? "dark" : "light"
  return icons[name][theme]
}

function SearchErrorView() {
  return (
    <View style={{
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start"
    }}>
      <CustomLabel adaptToTheme labelText="🤔" />
      <CustomLabel adaptToTheme fade italic labelText="hmm... we are having trouble searching right now" />
    </View>
  )
}

function NoResult() {
  return (
    <View style={{
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start"
    }}>
      <CustomLabel adaptToTheme fontSize={25} labelText="🧐" />
      <CustomLabel adaptToTheme bold italic fade labelText="No results" />
    </View>
  )
}

function LoadingView() {
  return (
    <View>
      <ProfileItemSkeleton />
      <Spacer />
      <ProfileItemSkeleton />
    </View>
  )
}

type matchingContactsProps = {
  searchStr: string
  contacts: Contacts.Contact[]
}
function MatchingContacts({ searchStr, contacts }: matchingContactsProps) {
  return (
    <View>
      {
        contacts.filter(contact => contact.name.includes(searchStr)).map(c => {
          return (
            <View key={c.name + Math.random()}>
              <CustomLabel labelText={c.name} />
              <CustomButton labelText="Invite" />
            </View>
          )
        })
      }
    </View>
  )
}

const HISTORY = [
  { id: "1", nickname: "mad.max", name: "maxwell" }
]

export default function SearchScreen() {
  const [searchStr, setSearchStr] = useState("")
  const router = useRouter()
  const [showCancel, setShowCancel] = useState(false)
  const [debouncedSearchStr, setDebouncedSearchStr] = useState("")
  const [contacts, setContacts] = useState<Contacts.Contact[]>()
  const [contactPermission, setContactPermission] = useState(false)
  const inputRef = useRef<TextInput>(null)
  const isInFocus = useIsFocused()
  const insets = useSafeAreaInsets()

  async function getContacts() {
    const { granted } = await Contacts.requestPermissionsAsync();
    if (granted) {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name],
      });
      setContacts(data)
      setContactPermission(true)
    } else {
      setContactPermission(false)
      showSettingsAlert("Contacts", "Allow the app to access your contacts so you can easily invite friends.", false)
    }

  }

  useEffect(() => {
    // focus on search bar when page is shown
    if (!isInFocus) return
    inputRef.current?.focus()
  }, [isInFocus])

  const debounceInput = useMemo(() => {
    return debounce((value: string) => {
      setDebouncedSearchStr(value);
    }, 300);
  }, []);
  const {
    data: search,
    isPending: searchPending,
    error: searchErr
  } = useSearchUserApi(debouncedSearchStr.trim())

  function handleSearchInputChange(e: string) {
    setSearchStr(e)
    debounceInput(e)
  }

  function handleUserClick(userId: string, tempNickname: string) {
    router.push({
      pathname: "/user-profile",
      params: { userId, tempNickname }
    })
  }

  const renderUser: ListRenderItem<UserDetails> = ({ item }) => (
    <ProfileItem key={item.userId} handleClick={() => {
      handleUserClick(item.userId ?? "", item.nickname ?? "")
    }} userDetails={item} />
  );

  return (
    <>
      {<CustomView adaptToTheme horizontalPadding={10}>
        <SafeAreaView style={{
          width: '100%'
        }}>
          <View style={styles.header}>
            <CustomLabel labelText="Search" width="100%" textAlign="center" adaptToTheme bold />
          </View>
          <Spacer size="small" />
          <View style={{
            width: "100%",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-start"
          }}>
            <CustomSearchInput ref={inputRef} value={searchStr} handleChange={e => {
              handleSearchInputChange(e)
            }} placeholder="find people you know" borderRadius={17} useRedBorders={searchStr.length > MAX_SEARCH_STRING_CHARS} handleOnFocus={() => setShowCancel(true)} handleOnBlur={() => setShowCancel(false)} />
            {showCancel && <CustomButton adaptToTheme type="text" labelText="Cancel" paddingHorizontal={0} squashed handleClick={() => {
              setSearchStr("")
              handleSearchInputChange("")
              inputRef.current?.blur()
            }} />}
          </View>
          <Spacer size="tiny" />
          {searchStr.length > MAX_SEARCH_STRING_CHARS && <CustomLabel textColor="red" fontSize={14} labelText={`🚫 ${MAX_SEARCH_STRING_CHARS} characters max!`} />}
          <View style={{
            paddingHorizontal: 5
          }}>
            <Spacer />
            {(searchPending && searchStr.length > 1) &&
              <LoadingView />
            }
            {searchErr && <SearchErrorView />}
            {search && search?.length < 1 && !searchErr && <NoResult />}
            {search && search.length > 0 && <FlatList
              data={search}
              renderItem={renderUser}
              keyExtractor={item => item.userId ?? ""}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              ItemSeparatorComponent={() => (<Spacer size="small" />)}
              keyboardDismissMode="interactive"
              keyboardShouldPersistTaps="handled"
            />}
          </View>
        </SafeAreaView>
      </CustomView>}
      {false && <SunkenView>
        <ElevatedView style={{
          paddingTop: insets.top,
          borderRadius: 0,
          paddingBottom: 15,
          paddingHorizontal: 15,
          marginBottom: 15,
        }}>
          <CustomLabel bold labelText="Search" adaptToTheme textAlign="center" />
          <Spacer size="small" />
          <View style={{
            width: "100%",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-start"
          }}>
            <CustomSearchInput ref={inputRef} value={searchStr} handleChange={e => {
              handleSearchInputChange(e)
            }} placeholder="find people you know" useRedBorders={searchStr.length > MAX_SEARCH_STRING_CHARS} handleOnFocus={() => setShowCancel(true)} handleOnBlur={() => setShowCancel(false)} />
            {showCancel && <CustomButton adaptToTheme type="text" labelText="Cancel" paddingHorizontal={0} squashed handleClick={() => {
              setSearchStr("")
              handleSearchInputChange("")
              inputRef.current?.blur()
            }} />}
          </View>
        </ElevatedView>

      </SunkenView>}
    </>
  )
}

const styles = StyleSheet.create({
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  container: {
    flex: 1,
    width: "100%",
  },
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
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    padding: 15
  },
  searchInputImg: {
    width: 15,
    height: 15,
  },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 7,
    paddingHorizontal: 15,
    borderTopWidth: 0,
  },
})