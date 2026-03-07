import { UserDetails } from "@/api/models/userDetails";
import { useGetFriends } from "@/hooks/queries/useFriendsApi";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useLocationStore } from "@/utils/useLocationStore";
import { FlashList } from "@shopify/flash-list";
import { useEffect, useRef, useState } from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomButton from "../buttons/CustomButton";
import CustomSelector from "../buttons/CustomSelector";
import CustomLabel from "../CustomLabel";
import { useModal } from "../modals/ModalContext";
import CustomProfilePictureCircle from "../profile/CustomProfilePictureCircle";
import Spacer from "../Spacer";
import CustomSearchInput from "./CustomSearchInput";

interface props {
  title?: string
  height: number
  handleClose: () => void
}

interface friendProps {
  userId: string
  nickname: string
  name?: string | null
  dpUrl?: string | null
  locationStr: string
  onChange: (selected: boolean) => void
}

const icons = {
  back: {
    light: require("../../assets/images/icons/down_unsel_light.png"),
    dark: require("../../assets/images/icons/down_unsel_dark.png")
  }
}

function withAlpha(color: string, alpha: number) {
  // rgb/rgba
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i)
  if (rgbMatch) {
    const r = Number(rgbMatch[1])
    const g = Number(rgbMatch[2])
    const b = Number(rgbMatch[3])
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  // hex #RGB or #RRGGBB
  let hex = color.replace("#", "").trim()
  if (hex.length === 3) hex = hex.split("").map(c => c + c).join("")
  if (hex.length === 6) {
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  // fallback: if it's something like "white" and we can't parse it
  return `rgba(0,0,0,0)`
}

function getIconImage(name: keyof typeof icons, darkMode: boolean) {
  const theme = darkMode ? "dark" : "light"
  return icons[name][theme]
}

function FriendItem({ userId, nickname, name, dpUrl, onChange, locationStr }: friendProps) {
  const [selected, setSelected] = useState(false)
  const textCol = useThemeColor({}, "text")
  const bgCol = useThemeColor({}, "background")
  const fadedBgCol = useThemeColor({}, "fadedBackground")
  const vibTextCol = useThemeColor({}, "vibrantBackground")
  const darkVibTextCol = useThemeColor({}, "darkenVibrant")
  const selFadedWhite = "rgba(255, 255, 255, 0.3)"
  const mode = useColorScheme()
  const { address } = useLocationStore()


  return (
    <TouchableOpacity style={[style.profile, {
    }]} onPress={() => {
      onChange(!selected)
      setSelected(!selected)
    }}>
      <CustomProfilePictureCircle size={50} imgUrl={dpUrl ?? undefined} nickname={nickname} customTextStyle={{ fontWeight: selected ? "normal" : "normal" }} />
      <View style={style.profileNames}>
        <CustomLabel allowTruncate labelText={name ?? nickname} adaptToTheme bold={selected} customStyle={{ paddingVertical: 2, }} />
        <CustomLabel allowTruncate labelText={selected ? `${locationStr === sendOpt[0] ? `keep at ${address ?? "this location"}` :
          locationStr === sendOpt[1] ? "keep at their location" :
            "choose on map"
          }` : nickname} adaptToTheme customStyle={{ paddingVertical: 0, }} fade fontSize={13} />
      </View>
      <View style={[style.checkBox, { borderColor: selected ? "white" : textCol, backgroundColor: selected ? darkVibTextCol : "transparent", opacity: selected ? 1 : .35 }]}>
        {selected && <Image style={{ width: 12, height: 12 }} source={require("../../assets/images/icons/check_unsel_light.png")} />}
      </View>
    </TouchableOpacity>
  )
}

const listOpt = ["Recents", "All"]
const sendOpt = ["Your location", "Their location",]

export default function ShareScreen({ handleClose, title, height }: props) {
  const bgCol = useThemeColor({}, "background")
  const fadedBgCol = useThemeColor({}, "fadedBackground")
  const [search, setSearch] = useState("")
  const searchRef = useRef(null)
  const insets = useSafeAreaInsets()
  const { data, error, isPending } = useGetFriends("")
  const [friends, setFriends] = useState<UserDetails[] | null>(null)
  const mode = useColorScheme()
  const [selectedFriends, setSelectedFriends] = useState<string[]>([])
  const [crumbLocation, setCrumbLocation] = useState(sendOpt[0])
  const {showModal, hideModal} = useModal()

  useEffect(() => {
    if (data && data.message) {
      setFriends([...data.message, ...data.message,...data.message, ...data.message,...data.message, ...data.message,])
    }
  }, [data])

  return (
    <View style={[{ height: height, paddingTop: insets.top, backgroundColor: bgCol }, style.superContainer]}>
      <View style={[style.container]}>
        <View style={style.topBar}>
          <CustomButton adaptToTheme type="text" labelText="" imgSrc={getIconImage("back", mode === "light")} handleClick={handleClose} imgSize={23} paddingHorizontal={0} customStyle={{ padding: 0 }} />
          <CustomLabel labelText={title ?? "send crumbs to..."} adaptToTheme bold textAlign="center" />
          <CustomButton adaptToTheme imgSrc={require("../../assets/images/icons/down_unsel_dark.png")} type="text" labelText="" handleClick={handleClose} imgSize={23} paddingHorizontal={0} customStyle={{ padding: 0, opacity: 0 }} />
        </View>

        <Spacer size="small" />

        <View style={{ paddingHorizontal: 15, marginBottom: 15 }}>
          <CustomSearchInput ref={searchRef} value={search} handleChange={setSearch} placeholder="Search friends" />
        </View>

        <View>
          <CustomSelector options={listOpt} onSelect={s => console.log(s)} />
        </View>

        <View style={{ flex: 1, marginTop: 15, }}>
          <FlashList
            data={friends}
            renderItem={item => <FriendItem name={item.item.name ?? ""} nickname={item.item.nickname ?? "<unknown>"} locationStr={crumbLocation} dpUrl={item.item.dpUrl ?? ""} onChange={s => {
              if (s) {
                setSelectedFriends([...selectedFriends, item.item.userId ?? ""])
              } else {
                setSelectedFriends(selectedFriends.filter(f => f !== item.item.userId))
              }
            }} userId={item.item.userId ?? ""} />}
          />
          {/* Top fade */}
          <LinearGradient
            colors={["rgba(0, 0, 0, .075)", withAlpha(bgCol, 0)]}
            style={{ position: "absolute", top: 0, left: 0, right: 0, height: 30, pointerEvents: "none" }}
          />

          {/* Bottom fade */}
          <LinearGradient
            colors={[withAlpha(bgCol, 0), "rgba(0, 0, 0, .075)"]}
            style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 10, pointerEvents: "none" }}
          />
        </View>
      </View>

      {<View>
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 5,
        }}>
          <CustomLabel fontSize={14} adaptToTheme fade labelText="Crumb location: " customStyle={{ paddingHorizontal: 20}} />
          <CustomButton customStyle={{padding: 0}} type="less-vibrant-text" labelText="" imgSrc={require("../../assets/images/icons/help_unsel_vib.png")} imgSize={17} handleClick={() => {
            showModal({
              content: (
                <View>
                  <CustomLabel adaptToTheme labelText="Welcome to help." />
                  <CustomButton adaptToTheme type="text" labelText="close" handleClick={hideModal} />
                </View>
              )
            })
          }} />
        </View>
        <View>
          <CustomSelector options={sendOpt} onSelect={s => {
            setCrumbLocation(s)
          }} />
        </View>
        <Spacer />
        <CustomButton disabled={selectedFriends.length < 1} imgSrc={require("../../assets/images/icons/userlocation_sel_light.png")} labelText={`Send${selectedFriends.length > 1 ? " (" + selectedFriends.length + ")" : ""}`} useMinWidth imgSize={21} type="less-prominent" customStyle={{
          paddingTop: 30,
          paddingBottom: insets.bottom + 20,
          borderRadius: 0
        }} />
      </View>}
    </View>
  )
}

const style = StyleSheet.create({
  superContainer: {
    flex: 1,
  },
  container: {
    flex: 1
  },
  topBar: {
    paddingHorizontal: 15,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 7,
    paddingHorizontal: 15,
    borderTopWidth: 0,
  },
  profileNames: {
    marginLeft: 10,
    flexShrink: 1,
    flexGrow: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center"
  },
  checkBox: {
    borderRadius: 1000,
    borderWidth: 1,
    width: 21,
    height: 21,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  sendButtonContainer: {
    paddingHorizontal: 25,
    paddingTop: 30,
    paddingBottom: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  sendButton: {
    borderRadius: 0,
    paddingHorizontal: 10,
    paddingVertical: 20,
    marginVertical: 5
  }
})