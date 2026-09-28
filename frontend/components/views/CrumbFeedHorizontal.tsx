import { FeedItem } from "@/api/db/crumbsDb";
import { useThemeColor } from "@/hooks/useThemeColor";
import { ChevronUpIcon, SearchIcon, UserPlus2Icon } from "lucide-react-native";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import CustomButton from "../buttons/CustomButton";
import CustomLabel from "../CustomLabel";
import Spacer from "../Spacer";
import CrumbFeedFriend from "./CrumbFeedFriend";

interface props {
  feed: Map<string, FeedItem> | undefined
  feedIsPending: boolean
  feedError: Error | null
  onSearchPress: () => void
  openSheet: () => void
}

export default function CrumbFeedHorizontal({ feed, feedError, feedIsPending, onSearchPress, openSheet }: props) {
  const textCol = useThemeColor({}, "text")
  return (
    <View
      style={styles.container}
    >
      <CustomButton
        freed
        type="text"
        customStyle={{
          width: 52,
          height: 52,
        }}
        handleClick={() => {
          openSheet()
        }}
      >
        <ChevronUpIcon stroke={textCol} strokeWidth={3.5} size={22} />
      </CustomButton>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {(feed?.size ?? 0) > 0 && <>
          {feed &&
            Array.from(feed).map(([friend_id, item], index) => (
              <React.Fragment key={friend_id}>
                <CrumbFeedFriend simplified key={friend_id} friendId={friend_id} feedItem={item} />
                {index + 1 < feed.size &&
                  <Spacer size="small" />
                }
              </React.Fragment>
            ))
          }
          <Spacer size="small" />
        </>}

        <CustomButton
          freed
          type="theme-faded"
          customStyle={{
            width: "auto",
            height: 52,
            paddingHorizontal: 15,
            opacity: (feed?.size ?? 0) > 0 ? .7 : 1
          }}
        >
          <UserPlus2Icon stroke={textCol} strokeWidth={2.5} size={20} />
          <Spacer size="tiny" />
          <CustomLabel fontSize={14} adaptToTheme bold labelText="add friends" />
        </CustomButton>
      </ScrollView>
      <CustomButton
        handleClick={onSearchPress}
        freed
        type="text"
        customStyle={{
          width: 52,
          height: 52,
        }}
      >
        <SearchIcon stroke={textCol} strokeWidth={3.5} size={21} />
      </CustomButton>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingRight: 15,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-start",
  }
})