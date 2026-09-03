import { useCrumbFeed } from "@/hooks/queries/useCrumbDbQueries";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import CustomButton from "../buttons/CustomButton";
import CustomLabel from "../CustomLabel";
import Spacer from "../Spacer";

export default function CrumbFeed() {
  const {
    data: feed,
    error,
    isPending
  } = useCrumbFeed()

  const nav = useRouter()
  const dimensions = useWindowDimensions()
  const [emptyFeedTop, setEmptyFeedTop] = useState(0)
  const handleFindFriends = () => {
    nav.push("/find-friends")
  }

  return (
    <View
      style={styles.container}
    >
      <CustomLabel adaptToTheme bold fontSize={21} labelText="Crumbs" />
      <View
        style={styles.feed}
      >
        {(feed?.length ?? 0) > 0 && <View>
          {
            feed?.map(id => (
              <CustomLabel key={id} adaptToTheme labelText={id} />
            ))
          }
        </View>}
        {(feed?.length ?? 0) === 0 && <View
          onLayout={(e) => {
            setEmptyFeedTop((dimensions.height / 2) - e.nativeEvent.layout.height - 100)
          }}
          style={[styles.emptyFeed, {
            top: emptyFeedTop
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
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  feed: {
    width: "100%",
  },
  emptyFeed: {
    position: "absolute",
    width: "100%",
    flexDirection: "column",
    alignItems: "center",
    paddingHorizontal: 15,
  }
})