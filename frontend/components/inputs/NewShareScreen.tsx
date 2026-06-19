import { UserDetails } from "@/api/models/userDetails";
import { useGetFriends } from "@/hooks/queries/useFriendsApi";
import { useGetUser } from "@/hooks/queries/useUserApi";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import { useShareCrumb } from "@/hooks/useShareCrumb";
import { useThemeColor } from "@/hooks/useThemeColor";
import { ChevronDownIcon } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomButton from "../buttons/CustomButton";
import CustomFloatingSquare from "../buttons/CustomFloatingSquare";
import CustomLabel from "../CustomLabel";
import FriendOption from "../share/FriendOption";
import LocationOption, { LocationOptionsProps } from "../share/LocationOption";
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
  processMedia: () => void;
}

export default function NewShareScreen({ title, height, handleClose, usePlural, processMedia }: props) {
  const shareButtonClickAfterMountDelay = 500
  const insets = useSafeAreaInsets();
  const mode = useColorScheme();
  const bgCol = mode === "dark" ? "#181818" : "#F4F5F7";
  const textCol = useThemeColor({}, "text")
  const [search, setSearch] = useState("");
  const searchRef = useRef(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isFetching, error } = useGetFriends("")
  const { data: myProfile, isFetching: isFetchingMyProfile, error: myProfileErr } = useGetUser("")
  const { locationOptions, recipients, setRecipients, isPending, handleShare, showMap, setShowMap, selectedLocation, setSelectedLocation, address } = useShareCrumb(processMedia)

  const [enableShare, setEnableShare] = useState(false)

  useEffect(() => {
    setEnableShare(false)
    let timerId: number | null = null
    if (!showMap) {
      timerId = setTimeout(() => {
        setEnableShare(true)
      }, shareButtonClickAfterMountDelay)
    }

    return () => {
      if (timerId) {
        clearTimeout(timerId)
      }
    }
  }, [showMap])

  type FriendOption = {
    isCurrentUser: boolean
  } & UserDetails;

  const items: FriendOption[] = [
    { ...myProfile!, isCurrentUser: true },
    ...(data?.pages.flatMap((page) =>
      page.Friends.map((f): FriendOption => ({ ...f, isCurrentUser: false }))
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
      data: locationOptions,
      keyExtractor: (item: LocationOptionsProps) => item.name,
      renderItem: (item: LocationOptionsProps) => (
        <LocationOption
          iconEmoji={item.iconEmoji}
          name={item.name}
          selected={item.selected}
          selectedName={item.selectedName}
          selectedText={item.selectedText}
          key={item.name}
          onChanged={item.onChanged}
          onPressed={item.onPressed}
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
        <FriendOption
          isSelected={recipients.some(r => r.id === item.userId)}
          nickname={deriveName(item)}
          userid={item.userId ?? ""}
          name={item.nickname ?? ""}
          onChange={(s) => {
            if (s) {
              // select
              if (!item.userId) return
              setRecipients([...recipients, {
                id: item.userId!,
                name: deriveName(item)
              }]);
            } else {
              // unselect
              setRecipients(recipients.filter((f) => f.id !== item.userId));
            }
          }}
          address={address ?? undefined}
        />
      ),
    },
    {
      type: "raw",
      component: (
        <CustomLabel width="auto" fade fontSize={13} adaptToTheme labelText="add more friends to share breadcrumbs with them" customStyle={{ opacity: .5 }} />
      ),
      key: "raw",
      hidden: items.length > 1,
    },
  ];

  return (
    <>
      {!showMap &&
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
              <CustomFloatingSquare isFlat handleClick={handleClose} customStyle={{ padding: 0 }}>
                <ChevronDownIcon size={23} stroke={textCol} strokeWidth={3} />
              </CustomFloatingSquare>
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

          <Spacer />
          <ElevatedSectionedScrollView
            sections={sections}
            style={{ flex: 1 }}
          />

          <CustomButton
            isPending={isPending}
            imgSrc={require("../../assets/images/icons/userlocation_sel_light.png")}
            type="less-prominent"
            labelText={recipients.length === 0 ? "Share" : `Share with ${recipients.map(f => f.name).join(", ")}`}
            customStyle={{
              borderRadius: 0,
              paddingBottom: insets.bottom + 20,
              paddingTop: insets.bottom / 1.25,
            }}
            customTextStyle={{ maxWidth: "85%" }}
            disabled={recipients.length < 1 || !enableShare}
            handleClick={handleShare}
          />
        </View>
      }
      {showMap &&
        <ChooseOnMap
          onCancel={() => setShowMap(false)}
          onLocationSelected={() => setShowMap(false)}
          selectedLocation={selectedLocation}
          setSelectedLocation={setSelectedLocation}
        />
      }
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});