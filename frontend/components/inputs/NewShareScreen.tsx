import { useColorScheme } from "@/hooks/useColorScheme.web";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useLocationStore } from "@/utils/useLocationStore";
import { useRef, useState } from "react";
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomButton from "../buttons/CustomButton";
import CustomSelector from "../buttons/CustomSelector";
import CustomLabel from "../CustomLabel";
import CustomProfilePictureCircle from "../profile/CustomProfilePictureCircle";
import Spacer from "../Spacer";
import ElevatedList from "../views/ElevatedList";
import ElevatedView from "../views/ElevatedView";
import CustomSearchInput from "./CustomSearchInput";
"../views/ElevatedList";

interface props {
  title?: string
  height: number
  usePlural?: boolean
  handleClose: () => void
}

const icons = {
  back: {
    light: require("../../assets/images/icons/down_unsel_light.png"),
    dark: require("../../assets/images/icons/down_unsel_dark.png")
  },
  world: {
    light: require("../../assets/images/icons/map_sel_light.png"),
    dark: require("../../assets/images/icons/map_sel_dark.png")
  }
}
function getIconImage(name: keyof typeof icons, darkMode: boolean) {
  const theme = darkMode ? "dark" : "light"
  return icons[name][theme]
}

const sendOpt = ["My current location", "Their location", "Choose on map"]

const RECENTS = [
  { username: "catluvr", name: "meow" },
]
const FAKE_FRIENDS = [
  { username: "johnny.test (me)", name: "jt" },
  { username: "david.arubuike", name: "david" },
]

const FriendItem = ({ username, name, onChange, selectedTxt }: { username: string, name: string, onChange: (s: boolean) => void, selectedTxt: string }) => {
  const fadedBg = useThemeColor({}, "fadedBackground")
  const vibCol = useThemeColor({}, "darkenVibrant")
  const [selected, setSelected] = useState(false)
  return (
    <TouchableOpacity style={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      padding: 7,
    }} onPress={() => {
      onChange(!selected)
      setSelected(!selected)
    }}>
      <CustomProfilePictureCircle nickname={username} size={45} customStyle={{ marginRight: 10 }} />
      <View style={{
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        flexGrow: 1,
        flexShrink: 1,
      }}>
        <CustomLabel allowTruncate customStyle={{ padding: 0, fontSize: 16 }} labelText={username} bold={selected} adaptToTheme />
        <CustomLabel allowTruncate customStyle={{ padding: 0, marginTop: 2.5 }} fontSize={13.5} fade labelText={selected ? selectedTxt : name} adaptToTheme />
      </View>
      <View style={{
        width: 21,
        height: 21,
        borderColor: selected ? vibCol : fadedBg,
        borderWidth: 2,
        borderRadius: 1000,
        marginRight: 5,
        backgroundColor: selected ? vibCol : "transparent",
        alignItems: "center",
        justifyContent: "center",
      }}>
        {selected && <Image source={require("../../assets/images/icons/check_unsel_light.png")} style={{
          height: 13,
          width: 13,
        }} />}
      </View>
    </TouchableOpacity>
  )
}

export default function NewShareScreen({ title, height, handleClose, usePlural }: props) {
  const insets = useSafeAreaInsets()
  const mode = useColorScheme()
  const bgCol = mode === "dark" ? "#181818" : "#F4F5F7"
  const fadedBg = useThemeColor({}, "fadedBackground")
  const [search, setSearch] = useState("")
  const searchRef = useRef(null)
  const [selectedFriends, setSelectedFriends] = useState<string[]>([])
  const [selLoc, setSelLoc] = useState(sendOpt[0])
  const { address } = useLocationStore()

  const getLocText = () => {
    if (selLoc === sendOpt[0]) return `📍${address ?? "your current location"}`
    else if (selLoc === sendOpt[1]) return `📍their location`
    else return `📍custom location`
  }

  return (
    <View style={[styles.container, {
      height: height,
      backgroundColor: bgCol,
    }]}>
      <ElevatedView style={{
        paddingTop: insets.top,
        paddingHorizontal: 0,
        borderRadius: 0,
      }}>
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 15,
        }}>
          {/* header */}
          <CustomButton adaptToTheme type="text" labelText="" imgSrc={getIconImage("back", mode === "light")} handleClick={handleClose} imgSize={23} paddingHorizontal={0} customStyle={{ padding: 0 }} />
          {/* <CustomLabel labelText={title ?? `Share`} adaptToTheme bold textAlign="center" /> */}
          <CustomButton adaptToTheme imgSrc={require("../../assets/images/icons/down_unsel_dark.png")} type="text" labelText="" handleClick={handleClose} imgSize={23} paddingHorizontal={0} customStyle={{ padding: 0, opacity: 0 }} />
        </View>

        <View style={{
          paddingHorizontal: 15,
        }}>
          <Spacer size="small" />
          <CustomSearchInput handleChange={setSearch} ref={searchRef} value={search} placeholder="Search friends..." />
        </View>

        <View style={{
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          borderTopColor: fadedBg
        }}>
          <Spacer size="small" />

          <CustomLabel labelText={`Leave crumb${usePlural ? "s" : ""} at:`} adaptToTheme customStyle={{ paddingHorizontal: 20 }} bold fade fontSize={14} />
          <CustomSelector borderRadius={100} onSelect={s => {
            setSelLoc(s)
          }} options={sendOpt} />
        </View>
        <Spacer size="small" />

      </ElevatedView>

      <ScrollView style={{
        flex: 1,
        paddingHorizontal: 15,
        paddingTop: 15,
      }}>
        {RECENTS.length > 0 &&
          <ElevatedList
            title="Recents"
            data={RECENTS}
            keyExtractor={item => item.username}
            renderItem={friend => <FriendItem
              onChange={s => {
                if (s) {
                  setSelectedFriends([...selectedFriends, friend.username ?? ""])
                } else {
                  setSelectedFriends(selectedFriends.filter(f => f !== friend.username))
                }
              }}
              name={friend.name}
              username={friend.username}
              selectedTxt={getLocText()}
            />}
          />
        }

        {FAKE_FRIENDS.length > 0 &&
          <ElevatedList
            title="All friends"
            data={FAKE_FRIENDS}
            keyExtractor={item => item.username}
            renderItem={friend => <FriendItem name={friend.name}
              username={friend.username}
              onChange={s => {
                if (s) {
                  setSelectedFriends([...selectedFriends, friend.username ?? ""])
                } else {
                  setSelectedFriends(selectedFriends.filter(f => f !== friend.username))
                }
              }}
              selectedTxt={getLocText()}
            />}
          />
        }
      </ScrollView>

      <CustomButton
        imgSrc={require("../../assets/images/icons/userlocation_sel_light.png")}
        type="less-prominent"
        labelText={
          selectedFriends.length === 0 ? "Share" :
          `Share with ${selectedFriends.join(", ")}`
        }
        customStyle={{
          borderRadius: 0,
          paddingBottom: insets.bottom + 20,
          paddingTop: insets.bottom / 1.25,
        }}
        customTextStyle={{maxWidth: "85%"}}
        disabled={selectedFriends.length < 1}
      />

    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
})