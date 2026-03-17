import { MediaItem } from "@/api/getPresignedUrl";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import { useMediaUpload } from "@/hooks/useMediaUpload";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useMediaStore } from "@/utils/mediaStore";
import { useLocationStore } from "@/utils/useLocationStore";
import { useRef, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomButton from "../buttons/CustomButton";
import CustomLabel from "../CustomLabel";
import { useModal } from "../modals/ModalContext";
import CustomProfilePictureCircle from "../profile/CustomProfilePictureCircle";
import Spacer from "../Spacer";
import ElevatedList from "../views/ElevatedList";
import ElevatedView from "../views/ElevatedView";
import CustomSearchInput from "./CustomSearchInput";

interface props {
  title?: string;
  height: number;
  usePlural?: boolean;
  handleClose: () => void;
  getProcessedMedia: () => Promise<MediaItem[]>;
}

const icons = {
  back: {
    light: require("../../assets/images/icons/down_unsel_light.png"),
    dark: require("../../assets/images/icons/down_unsel_dark.png"),
  },
  world: {
    light: require("../../assets/images/icons/map_sel_light.png"),
    dark: require("../../assets/images/icons/map_sel_dark.png"),
  },
};
function getIconImage(name: keyof typeof icons, darkMode: boolean) {
  const theme = darkMode ? "dark" : "light";
  return icons[name][theme];
}

const sendOpt = ["My location", "Friends' location", "Choose on map"];

const RECENTS = [{ username: "catluvr", name: "meow" }];
const FAKE_FRIENDS = [
  { username: "david.arubuike", name: "david" },
  { username: "catluvr", name: "meow" },
  { username: "johnny.test (me)", name: "jt" },
];

const FriendItem = ({
  username,
  name,
  onChange,
  selectedTxt,
}: {
  username: string;
  name: string;
  onChange: (s: boolean) => void;
  selectedTxt: string;
}) => {
  const fadedBg = useThemeColor({}, "fadedBackground");
  const vibCol = useThemeColor({}, "darkenVibrant");
  const [selected, setSelected] = useState(false);
  return (
    <TouchableOpacity
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: 7,
      }}
      onPress={() => {
        onChange(!selected);
        setSelected(!selected);
      }}
    >
      <CustomProfilePictureCircle nickname={username} size={45} customStyle={{ marginRight: 10 }} />
      <View
        style={{
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          flexGrow: 1,
          flexShrink: 1,
        }}
      >
        <CustomLabel
          allowTruncate
          customStyle={{ padding: 0, fontSize: 15, fontWeight: "500" }}
          labelText={username}
          bold={selected}
          adaptToTheme
        />
        {((selectedTxt && selected) || name) && (
          <CustomLabel
            customStyle={{ padding: 0, marginTop: 1.5, lineHeight: 18 }}
            fontSize={13.5}
            fade
            labelText={selected ? selectedTxt : name}
            adaptToTheme
          />
        )}
      </View>
      <View
        style={{
          width: 21,
          height: 21,
          borderColor: selected ? vibCol : fadedBg,
          borderWidth: 2,
          borderRadius: 1000,
          marginRight: 5,
          backgroundColor: selected ? vibCol : "transparent",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {selected && (
          <Image
            source={require("../../assets/images/icons/check_unsel_light.png")}
            style={{ height: 13, width: 13 }}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

interface locationItemProps {
  selected: boolean;
  setSelected: () => void;
  locationStr: string;
  selText: string;
}
const LocationItem = ({ selected, setSelected, locationStr, selText }: locationItemProps) => {
  const fadedBg = useThemeColor({}, "fadedBackground");
  const vibCol = useThemeColor({}, "darkenVibrant");
  return (
    <TouchableOpacity
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: 7,
      }}
      onPress={() => {
        setSelected();
      }}
    >
      <CustomProfilePictureCircle nickname={locationStr} size={45} customStyle={{ marginRight: 10 }} />
      <View
        style={{
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          flexGrow: 1,
          flexShrink: 1,
        }}
      >
        <CustomLabel
          allowTruncate
          customStyle={{ padding: 0, fontSize: 15, fontWeight: "500" }}
          labelText={locationStr}
          bold={selected}
          adaptToTheme
        />
        {selText && selected && (
          <CustomLabel
            customStyle={{ padding: 0, marginTop: 1.5, lineHeight: 18 }}
            fontSize={13.5}
            fade
            labelText={selText}
            adaptToTheme
          />
        )}
      </View>
      <View
        style={{
          width: 21,
          height: 21,
          borderColor: selected ? vibCol : fadedBg,
          borderWidth: 2,
          borderRadius: 1000,
          marginRight: 5,
          backgroundColor: selected ? vibCol : "transparent",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {selected && (
          <Image
            source={require("../../assets/images/icons/check_unsel_light.png")}
            style={{ alignSelf: "center", height: 13, width: 13 }}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

export default function NewShareScreen({ title, height, handleClose, usePlural, getProcessedMedia }: props) {
  const insets = useSafeAreaInsets();
  const mode = useColorScheme();
  const bgCol = mode === "dark" ? "#181818" : "#F4F5F7";
  const textCol = useThemeColor({}, "text")
  const [search, setSearch] = useState("");
  const searchRef = useRef(null);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [selLoc, setSelLoc] = useState(sendOpt[0]);
  const { address } = useLocationStore();
  const [shareIsPending, setShareIsPending] = useState(false)
  const { showModal, hideModal } = useModal()
  const resetMediaStore = useMediaStore(s => s.reset)

  const { upload } = useMediaUpload({
    onSuccess: () => {
      // TODO: send metadata to dynamo, close screen, etc.
      setShareIsPending(false)
      hideModal()
      resetMediaStore()
    },
    onError: (err) => {
      console.log("Share failed:", err);
      setShareIsPending(false)
      showModal({
        message: "Something went wrong, try again.",
        primaryBtnText: "Ok",
        onPrimary: hideModal
      })
    },
  });

  const getLocText = () => {
    if (selLoc === sendOpt[0]) return `📍${address ?? "your current location"}`;
    else if (selLoc === sendOpt[1]) return `📍their location`;
    else return `📍custom location`;
  };

  const handleShare = async () => {
    setShareIsPending(true)
    showModal({
      content: (
        <View style={{
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <CustomLabel bold adaptToTheme textAlign="center" labelText="Sharing, hang tight..." />
          <Spacer />
          <ActivityIndicator color={textCol} style={{
            width: 17,
            height: 17,
          }} />
          <Spacer />
        </View>
      )
    })
    const processMedia = await getProcessedMedia()
    upload(processMedia);
  };

  return (
    <View style={[styles.container, { height, backgroundColor: bgCol }]}>
      <ElevatedView
        flat
        style={{
          paddingTop: insets.top,
          paddingHorizontal: 0,
          borderRadius: 0,
          backgroundColor: "transparent",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 15,
          }}
        >
          <CustomButton
            adaptToTheme
            type="text"
            labelText=""
            imgSrc={getIconImage("back", mode === "light")}
            handleClick={handleClose}
            imgSize={23}
            paddingHorizontal={0}
            customStyle={{ padding: 0 }}
          />
          <CustomLabel labelText={title ?? `Share crumb${usePlural ? "s" : ""}`} adaptToTheme bold textAlign="center" />
          <CustomButton
            adaptToTheme
            imgSrc={require("../../assets/images/icons/down_unsel_dark.png")}
            type="text"
            labelText=""
            handleClick={handleClose}
            imgSize={23}
            paddingHorizontal={0}
            customStyle={{ padding: 0, opacity: 0 }}
          />
        </View>

        <View style={{ paddingHorizontal: 15 }}>
          <Spacer size="small" />
          <CustomSearchInput handleChange={setSearch} ref={searchRef} value={search} placeholder="Search friends..." />
        </View>
      </ElevatedView>

      <ScrollView style={{ flex: 1, paddingHorizontal: 15, paddingTop: 15 }}>
        <ElevatedList
          title="Leave crumb at"
          data={sendOpt}
          keyExtractor={(item) => item}
          renderItem={(item) => (
            <LocationItem
              locationStr={item}
              selected={selLoc === item}
              setSelected={() => setSelLoc(item)}
              selText={
                item === sendOpt[0]
                  ? `Crumb${usePlural ? "s" : ""} can only be viewed here`
                  : item === sendOpt[1]
                    ? `Crumb${usePlural ? "s" : ""} can be viewed immediately`
                    : `Crumb${usePlural ? "s" : ""} can only be viewed there`
              }
            />
          )}
        />

        {FAKE_FRIENDS.length > 0 && (
          <ElevatedList
            title="Share with"
            data={FAKE_FRIENDS}
            keyExtractor={(item) => item.username}
            renderItem={(friend) => (
              <FriendItem
                name={friend.name}
                username={friend.username}
                onChange={(s) => {
                  if (s) {
                    setSelectedFriends([...selectedFriends, friend.username ?? ""]);
                  } else {
                    setSelectedFriends(selectedFriends.filter((f) => f !== friend.username));
                  }
                }}
                selectedTxt={getLocText()}
              />
            )}
          />
        )}
      </ScrollView>

      <CustomButton
        isPending={shareIsPending}
        imgSrc={require("../../assets/images/icons/userlocation_sel_light.png")}
        type="less-prominent"
        labelText={selectedFriends.length === 0 ? "Share" : `Share with ${selectedFriends.join(", ")}`}
        customStyle={{
          borderRadius: 0,
          paddingBottom: insets.bottom + 20,
          paddingTop: insets.bottom / 1.25,
        }}
        customTextStyle={{ maxWidth: "85%" }}
        disabled={selectedFriends.length < 1}
        handleClick={handleShare}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});