import { useCrumbFeed } from "@/hooks/queries/useCrumbDbQueries";
import { useCenterOfBottomSheet } from "@/hooks/useCenterOfBottomSheet";
import { useThemeColor } from "@/hooks/useThemeColor";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { ChevronDownIcon, ChevronUpIcon, SearchIcon } from "lucide-react-native";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { SharedValue, useAnimatedReaction } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import CustomButton from "../buttons/CustomButton";
import CustomLabel from "../CustomLabel";
import Spacer from "../Spacer";
import CrumbFeedFriend from "./CrumbFeedFriend";
import CrumbFeedHorizontal from "./CrumbFeedHorizontal";

interface props {
  screenHeight: number
  sheetPosition: SharedValue<number>
  bottomSheetRef: React.RefObject<BottomSheet | null>
  onSearchPress: () => void
}

export default function CrumbFeed({ sheetPosition, screenHeight, bottomSheetRef, onSearchPress }: props) {

  const [isOpened, setIsOpened] = useState(false)

  const handleToggleSheet = () => {
    if (!bottomSheetRef) return
    if (isOpened) bottomSheetRef.current?.collapse()
    else bottomSheetRef.current?.expand()
  }

  useAnimatedReaction(
    () => sheetPosition.value < screenHeight * .8, // true = sheet is high up
    (isSheetUp, previous) => {
      if (isSheetUp !== previous) {
        scheduleOnRN(setIsOpened, isSheetUp)
      }
    }
  );

  const {
    data: feed,
    error,
    isPending
  } = useCrumbFeed()

  const nav = useRouter()
  const {
    top: centerTop,
    onLayout: onCenterLayout,
  } = useCenterOfBottomSheet()
  const handleFindFriends = () => {
    nav.push("/find-friends")
  }
  const textCol = useThemeColor({}, "text")

  return (
    <BottomSheetView
      style={styles.container}
    >
      {isOpened && <>
        <View
          style={{
            width: "100%",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CustomButton
            freed
            type="text"
            customStyle={{
              position: "absolute",
              left: 20,
              padding: 10
            }}
            handleClick={() => {
              handleToggleSheet()
            }}
          >
            {isOpened && <ChevronDownIcon stroke={textCol} strokeWidth={3.5} size={21} />}
            {!isOpened && <ChevronUpIcon stroke={textCol} strokeWidth={3.5} size={21} />}
          </CustomButton>
          <CustomLabel adaptToTheme bold fontSize={23} labelText={"Friends"} />
          <CustomButton
            handleClick={onSearchPress}
            freed
            type="theme-faded"
            customStyle={{
              position: "absolute",
              right: 20,
              padding: 10
            }}
          >
            <SearchIcon stroke={textCol} strokeWidth={3.5} size={18} />
          </CustomButton>
        </View>
        <View
          style={styles.feed}
        >
          {(feed?.size ?? 0) > 0 && <View>
            {feed &&
              Array.from(feed).map(([friend_id, item], index) => (
                <React.Fragment key={friend_id}>
                  <CrumbFeedFriend friendId={friend_id} feedItem={item} />
                  {
                    index + 1 < feed.size &&
                    <Spacer size="small" />
                  }
                </React.Fragment>
              ))
            }
          </View>}
          {(feed?.size ?? 0) === 0 && <View
            onLayout={onCenterLayout}
            style={[styles.emptyFeed, {
              top: centerTop
            }]}
          >
            <CustomLabel adaptToTheme fontSize={27} labelText="👀" />
            <Spacer size="tiny" />
            <CustomLabel fontSize={17} bold adaptToTheme labelText="No crumbs here yet" />
            <Spacer size="tiny" />
            <CustomLabel fontSize={13} fade adaptToTheme labelText="Add your friends to get started" />
            <Spacer />
            <CustomButton handleClick={handleFindFriends} slim type="less-prominent" paddingHorizontal={20} labelText="Find Friends" />
          </View>}
        </View>
      </>}
      {!isOpened &&
        <CrumbFeedHorizontal onSearchPress={onSearchPress} feed={feed} feedError={error} feedIsPending={isPending} />
      }
    </BottomSheetView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 25,
  },
  feed: {
    paddingTop: 20,
    paddingLeft: 15,
    paddingRight: 28,
    width: "100%",
  },
  emptyFeed: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  }
})