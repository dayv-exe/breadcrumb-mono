import { MediaItem } from "@/api/getPresignedUrl";
import { UserDetails } from "@/api/models/userDetails";
import { DEFAULT_CRUMB_RADIUS, ShowToast } from "@/constants/appConstants";
import { useShareCrumb } from "@/hooks/queries/useCrumbsApi";
import { useGetFriends } from "@/hooks/queries/useFriendsApi";
import { useGetUser } from "@/hooks/queries/useUserApi";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import { useMediaUpload } from "@/hooks/useMediaUpload";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useMediaStore } from "@/utils/mediaStore";
import { useLocationStore } from "@/utils/useLocationStore";
import { useRef, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomButton from "../buttons/CustomButton";
import CustomLabel from "../CustomLabel";
import { useModal } from "../modals/ModalContext";
import CustomProfilePictureCircle from "../profile/CustomProfilePictureCircle";
import Spacer from "../Spacer";
import { ElevatedSectionedScrollView, Section } from "../views/ElevatedSectionedScrollView";
import ElevatedView from "../views/ElevatedView";
import ChooseOnMap from "./ChooseOnMap";
import CustomSearchInput from "./CustomSearchInput";

interface props {
  title?: string;
  height: number;
  usePlural?: boolean;
  handleClose: () => void;
  getProcessedMedia: () => Promise<MediaItem[]>;
}
interface iSelectedFriend {
  name: string
  id: string
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
const ShareListItem = ({
  title,
  subtitle,
  onChange,
  selectedTxt,
  userId
}: {
  userId?: string
  title: string;
  subtitle: string;
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
      <CustomProfilePictureCircle nickname={title} size={45} customStyle={{ marginRight: 10 }} userId={userId} />
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
          labelText={title}
          bold={selected}
          adaptToTheme
        />
        {((selectedTxt && selected) || subtitle) && (
          <CustomLabel
            customStyle={{ padding: 0, marginTop: 1.5, lineHeight: 18 }}
            fontSize={13.5}
            fade
            labelText={selected ? selectedTxt : subtitle}
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
  onChanged?: (s: boolean) => void
  onPressed?: (s: boolean) => void
}
const LocationItem = ({ selected, setSelected, locationStr, selText, onChanged, onPressed }: locationItemProps) => {
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
        onChanged?.(!selected)
        onPressed?.(!selected)
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
  const [selectedFriends, setSelectedFriends] = useState<iSelectedFriend[]>([]);
  const [selLoc, setSelLoc] = useState(sendOpt[0]);
  const { address, coordinates } = useLocationStore();
  const [shareIsPending, setShareIsPending] = useState(false)
  const { showModal, hideModal } = useModal()
  const resetMediaStore = useMediaStore(s => s.reset)

  const handleNotifyErr = (err: any) => {
    console.log("Share failed:", err);
    setShareIsPending(false)
    showModal({
      message: "Something went wrong, try again.",
      primaryBtnText: "Ok",
      onPrimary: hideModal
    })
  }

  const { upload } = useMediaUpload({
    onSuccess: files => {
      shareCrumb({
        id: files[0].crumbId,
        lat: coordinates?.latitude ?? 0,
        lon: coordinates?.longitude ?? 0,
        text: files.filter(f => f.type === "text").map(f => ({
          index: f.index,
          content: f.text?.content ?? ""
        })),
        mediaItems: files.filter(f => f.type !== "text").map(f => ({
          index: f.index,
          media: f.media?.mediaKey,
          type: f.type,
          overlay: f.overlay?.mediaKey,
          thumbnail: f.thumbnail?.mediaKey,
        })),
        locationAccuracy: coordinates?.accuracy ?? DEFAULT_CRUMB_RADIUS,
        locationType: selLoc === sendOpt[2] ? "map" : selLoc === sendOpt[1] ? "friend" : "mine",
        receivers: selectedFriends.map(f => f.id),
      }, {
        onSuccess: (s) => {
          if (s.error) {
            handleNotifyErr(s.error)
            return
          }
          setShareIsPending(false)
          hideModal()
          resetMediaStore()
          ShowToast("✅ Done")
        },
        onError: err => {
          handleNotifyErr(err)
        }
      })
    },
    onError: (err) => {
      handleNotifyErr(err)
    },
  });

  const getLocText = () => {
    if (selLoc === sendOpt[0]) return `📍${address ?? "your current location"}`;
    else if (selLoc === sendOpt[1]) return `📍their location`;
    else return `📍custom location`;
  };

  const { mutate: shareCrumb } = useShareCrumb()

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

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isFetching, error } = useGetFriends("")
  const { data: myProfile, isFetching: isFetchingMyProfile, error: myProfileErr } = useGetUser("")

  type ShareOption = {
    optType: "option";
    id: string;
    title: string;
    subtitle: string;
    selText: string
  };

  type FriendOption = {
    isCurrentUser: boolean
  } & UserDetails;

  const items: FriendOption[] = [
    { ...myProfile?.message!, isCurrentUser: true },
    ...(data?.pages.flatMap((page) =>
      page.message.map((f): FriendOption => ({ ...f, isCurrentUser: false }))
    ) ?? []),
  ];

  const deriveName = (item: FriendOption): string => {
    return (item.name ? item.name : item.nickname ?? "*No name*") + `${item.isCurrentUser ? " (Me)" : ""}`
  }

  const sections: Section[] = [
    {
      key: "send-options",
      type: "static",
      title: `Leave crumb${usePlural ? "s" : ""} at`,
      data: sendOpt,
      keyExtractor: (item) => item,
      renderItem: (item) => (
        <LocationItem
          locationStr={item}
          selected={selLoc === item}
          setSelected={() => setSelLoc(item)}
          onPressed={s => {
            if (item !== sendOpt[2]) return
            showModal({
              overrideDefaultBg: true,
              content: (
                <ChooseOnMap handleCancel={hideModal} handleChooseLocation={(lat, lon) => { }} />
              ),
            })
          }}
          onChanged={s => {
            if (item === sendOpt[3]) {
              setSelectedFriends([])
            }
          }}
          selText={
            item === sendOpt[0]
              ? `Crumb${usePlural ? "s" : ""} can only be viewed here`
              : item === sendOpt[1] ? `They can view crumb${usePlural ? "s" : ""} immediately`
                : item === sendOpt[2] ? `Crumb${usePlural ? "s" : ""} can only be viewed there`
                  : `Visible to all your friends for 24h`
          }
        />
      ),
    },
    {
      key: "friends",
      type: "paginated",
      title: "Share with",
      data: items,
      hidden: (items.length === 0 && !hasNextPage) || error !== null || myProfileErr !== null,
      keyExtractor: (item: FriendOption) => item.userId ?? "",
      hasMore: hasNextPage ?? false,
      isFetchingMore: isFetchingNextPage || isFetching || isFetchingMyProfile,
      onEndReached: fetchNextPage,
      renderItem: (item: FriendOption) => (
        <ShareListItem
          title={deriveName(item)}
          userId={item.userId ?? ""}
          subtitle={item.nickname ?? ""}
          onChange={(s) => {
            if (s) {
              // select
              if (!item.userId) return
              setSelectedFriends([...selectedFriends, {
                id: item.userId!,
                name: deriveName(item)
              }]);
            } else {
              // unselect
              setSelectedFriends(selectedFriends.filter((f) => f.id !== item.userId));
            }
          }}
          selectedTxt={getLocText()}
        />
      ),
    },
  ];

  return (
    <View style={[styles.container, { height, backgroundColor: bgCol }]}>
      <ElevatedView
        flat
        style={{
          paddingTop: insets.top,
          paddingBottom: 0,
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

      <ElevatedSectionedScrollView
        sections={sections}
        style={{ flex: 1, paddingHorizontal: 15, paddingTop: 15 }}
      />

      <CustomButton
        isPending={shareIsPending}
        imgSrc={require("../../assets/images/icons/userlocation_sel_light.png")}
        type="less-prominent"
        labelText={selectedFriends.length === 0 ? "Share" : `Share with ${selectedFriends.map(f => f.name).join(", ")}`}
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