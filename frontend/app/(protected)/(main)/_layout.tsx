import { getLatestCrumbs } from "@/api/crumbsApi";
import { GetLastReceivedCrumbDetails } from "@/api/db/crumbsDb";
import CustomButton from "@/components/buttons/CustomButton";
import { useModal } from "@/components/modals/ModalContext";
import Spacer from "@/components/Spacer";
import { Colors } from "@/constants/Colors";
import { MediaData } from "@/constants/media";
import { useGetUser } from "@/hooks/queries/useUserApi";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuthStore } from "@/utils/authStore";
import { useMediaStore } from "@/utils/mediaStore";
import { Tabs, useSegments } from "expo-router";
import { Camera, Heart, Search, User } from "lucide-react-native";
import { useEffect } from "react";
import { ColorValue, Image, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useShallow } from "zustand/shallow";

const icons = {
  map: {
    light: {
      selected: require("../../../assets/images/icons/map_sel_dark.png"),
      unselected: require("../../../assets/images/icons/map_unsel_dark.png"),
    },
    dark: {
      selected: require("../../../assets/images/icons/map_sel_light.png"),
      unselected: require("../../../assets/images/icons/map_unsel_light.png"),
    },
  },
  notifications: {
    light: {
      selected: require("../../../assets/images/icons/notifications_sel_dark.png"),
      unselected: require("../../../assets/images/icons/notifications_unsel_dark.png"),
    },
    dark: {
      selected: require("../../../assets/images/icons/notifications_sel_light.png"),
      unselected: require("../../../assets/images/icons/notifications_unsel_light.png"),
    },
  },
  crumbs: {
    light: {
      selected: require("../../../assets/images/icons/crumbs_sel_dark.png"),
      unselected: require("../../../assets/images/icons/crumbs_unsel_dark.png"),
    },
    dark: {
      selected: require("../../../assets/images/icons/crumbs_sel_light.png"),
      unselected: require("../../../assets/images/icons/crumbs_unsel_light.png"),
    },
  },
  search: {
    light: {
      selected: require("../../../assets/images/icons/search_sel_dark.png"),
      unselected: require("../../../assets/images/icons/search_unsel_dark.png"),
    },
    dark: {
      selected: require("../../../assets/images/icons/search_sel_light.png"),
      unselected: require("../../../assets/images/icons/search_unsel_light.png"),
    },
  },

  add: {
    light: {
      selected: require("../../../assets/images/icons/add_sel_dark.png"),
      unselected: require("../../../assets/images/icons/add_unsel_dark.png"),
    },
    dark: {
      selected: require("../../../assets/images/icons/add_sel_light.png"),
      unselected: require("../../../assets/images/icons/add_unsel_light.png"),
    },
  },

  profile: {
    light: {
      selected: require("../../../assets/images/icons/profile_sel_dark.png"),
      unselected: require("../../../assets/images/icons/profile_unsel_dark.png"),
    },
    dark: {
      selected: require("../../../assets/images/icons/profile_sel_light.png"),
      unselected: require("../../../assets/images/icons/profile_unsel_light.png"),
    },
  },
};

function getIconImage(
  name: keyof typeof icons,
  focused: boolean,
  darkMode: boolean,
) {
  const theme = darkMode ? "dark" : "light";
  return icons[name][theme][focused ? "selected" : "unselected"];
}

type cIconProps = {
  name: keyof typeof icons;
  focused: boolean;
  darkMode: boolean;
  size?: number;
};

type cLabelProps = {
  text: string;
  color: ColorValue | undefined;
  focused?: boolean;
};

function CustomTabIcon({ name, focused, darkMode, size = 22 }: cIconProps) {
  return (
    <View
      style={{
        position: "relative",
      }}
    >
      <Image
        source={getIconImage(name, focused, darkMode)}
        style={{
          width: size,
          height: size,
        }}
        resizeMode="contain"
      />

      {focused && (
        <View
          style={{
            position: "absolute",
            width: 7,
            height: 4,
            backgroundColor: !darkMode ? Colors.light.text : Colors.dark.text,
            bottom: -17,
            left: 7.5,
            right: 0,
            borderRadius: 100,
          }}
        ></View>
      )}
    </View>
  );
}

function CustomTabLabel({ text, color, focused }: cLabelProps) {
  return (
    <Text
      style={[
        styles.tabLabel,
        { color: color, fontWeight: focused ? "bold" : "light" },
      ]}
    >
      {text}
    </Text>
  );
}

function MediaActionButtons({
  addMediaPreview,
  discardAllMedia,
}: {
  addMediaPreview: (m: MediaData) => void;
  discardAllMedia: () => void;
}) {
  const { previews, showMediaPreviews, setShowMediaPreviews, setSharing } = useMediaStore(useShallow(s => ({
    showMediaPreviews: s.showMediaPreviews,
    setShowMediaPreviews: s.setShowMediaPreviews,
    previews: s.mediaPreview,
    setSharing: s.setSharing,
  })))
  const { showModal, hideModal } = useModal()
  const { height } = useWindowDimensions()
  return (
    <View
      style={styles.navbar}
    >
      {!showMediaPreviews &&
        <>
          <CustomButton
            slim
            type="text"
            customTextStyle={{ color: showMediaPreviews ? "red" : "red" }}
            labelText={showMediaPreviews ? "Delete" : "Discard"}
            handleClick={() => {
              showModal({
                message: "Are you sure?",
                primaryBtnText: "No, keep",
                secondaryBtnText: "Yes, discard",
                onPrimary: hideModal,
                onSecondary: () => {
                  discardAllMedia()
                  hideModal()
                }
              })
            }}
          />
        </>
      }
      {showMediaPreviews && <CustomButton slim customStyle={{ minWidth: 100 }} type="dark-faded" customTextStyle={{ color: "white" }} labelText="Back" imgSrc={require("../../../assets/images/icons/longback_sel_light.png")} handleClick={() => setShowMediaPreviews(false)} />}
      <Spacer size="small" />
      {showMediaPreviews && <CustomButton slim customStyle={{ minWidth: 100 }} type="less-prominent" customTextStyle={{ color: "white" }} labelText="Share" imgSrc={require("../../../assets/images/icons/userlocation_sel_light.png")} handleClick={() => {
        setSharing(true)
      }} />}
      {!showMediaPreviews && <CustomButton slim customStyle={{ minWidth: 100 }} handleClick={() => setShowMediaPreviews(true)} type="less-prominent" customTextStyle={{ color: "white", paddingHorizontal: 12.5 }} labelText="Edit & Share" />}
    </View>
  );
}

function RecordingActionButtons() {
  return (
    <View
      style={styles.navbar}
    ></View>
  );
}

function CroppingActionButtons() {
  const { applyCrop, revertCrop } = useMediaStore(useShallow(s => ({
    applyCrop: s.applyCurrentMediaCrop,
    revertCrop: s.revertCurrentMediaCrop,
  })))

  return (
    <View style={styles.navbar}>
      <CustomButton slim labelText="Revert" imgSrc={require("../../../assets/images/icons/reset_unsel_light.png")} useMinWidth handleClick={revertCrop} />
      <Spacer size="small" />
      <CustomButton slim labelText="Apply" imgSrc={require("../../../assets/images/icons/check_unsel_light.png")} useMinWidth type="less-prominent" handleClick={applyCrop} customStyle={{ backgroundColor: "#00c04b" }} />
    </View>
  )
}

export default function MainScreen() {
  const { isRecording, mediaPreview, addMediaPreview, discardAllMediaPreview, editing } =
    useMediaStore(
      useShallow(s => ({
        isRecording: s.isRecording,
        mediaPreview: s.mediaPreview,
        addMediaPreview: s.addMediaPreview,
        discardAllMediaPreview: s.discardAllMediaPreview,
        editing: s.editing,
      }))
    );
  const segments = useSegments();
  const mode = useColorScheme();
  const textColor = useThemeColor({}, "text");

  const { data: currentUser } = useGetUser("")
  const setUserDetails = useAuthStore(s => s.setUserDetails)

  const fetchLatestCrumbs = async () => {
    const lastCrumb = await GetLastReceivedCrumbDetails()
    console.log("last crumb: ", lastCrumb)
    const latest = await getLatestCrumbs(false, lastCrumb?.id, lastCrumb?.time)
    console.log("latest: ", latest)
  }

  useEffect(() => {
    fetchLatestCrumbs()
    if (currentUser && currentUser) {
      setUserDetails(currentUser.nickname, currentUser.name, currentUser.dpUrl)
    }
  }, [currentUser])

  const isAddActive = () => {
    if (segments[2] === "add") return true;

    // on first mount segment might be empty or contain only (main) when displaying intial route add.tsx
    if (segments.length < 2) {
      if (segments[1] === "(main)") return true;
    }
    if (segments.length < 2 && segments[0] === "(protected)") return true;

    if (segments.length < 1) return true;
    return false;
  };
  const isDarkMode = mode === "dark" || isAddActive(); // to force navbar into dark mode when showing add screen with camera active because it looks better
  const getTextCol = (invert?: boolean) => {
    return isDarkMode && !invert ? Colors.dark.text : Colors.light.text
  }

  return (
    <View style={{
      flex: 1, backgroundColor: isDarkMode
        ? Colors.dark.background
        : Colors.light.background,
    }}>
      <Tabs
        initialRouteName="add"
        screenOptions={{
          headerShown: false,
          tabBarStyle: [styles.tabBar, {
            backgroundColor: isDarkMode
              ? Colors.dark.background
              : Colors.light.background,
            borderColor: "transparent",
          }],
          tabBarShowLabel: false,
        }}
      >
        <Tabs.Screen
          name="map"
          options={{
            title: "Map",
            tabBarIcon: ({ focused }) => (
              <CustomTabIcon
                name={"map"}
                size={25}
                focused={focused}
                darkMode={isDarkMode}
              />
            ),
            tabBarLabel: ({ focused }) => (
              <CustomTabLabel color={textColor} text="Map" focused={focused} />
            ),
            tabBarStyle: [styles.tabBar, {
              backgroundColor: isDarkMode
                ? Colors.dark.background
                : Colors.light.background,
              borderColor: isDarkMode ? "#444" : "#ccc",
            }],
          }}
        />

        <Tabs.Screen
          name="search"
          options={{
            title: "Search",
            tabBarIcon: ({ focused }) => (
              // <CustomTabIcon
              //   name={"search"}
              //   size={23}
              //   focused={focused}
              //   darkMode={isDarkMode}
              // />

              <>
                <Search size={25} stroke={getTextCol()} fill={focused ? getTextCol() : "none"} />
                {focused && (
                  <View
                    style={{
                      position: "absolute",
                      width: 7,
                      height: 4,
                      backgroundColor: mode === "light" ? Colors.light.text : Colors.dark.text,
                      bottom: -17,
                      borderRadius: 100,
                    }}
                  ></View>
                )}
              </>
            ),
            tabBarLabel: ({ focused }) => (
              <CustomTabLabel
                color={textColor}
                text="Search"
                focused={focused}
              />
            ),
            tabBarStyle: [styles.tabBar, {
              backgroundColor: isDarkMode
                ? Colors.dark.background
                : Colors.light.background,
              borderColor: isDarkMode ? "#444" : "#ccc",
            }],
          }}
        />

        <Tabs.Screen
          name="add"
          options={{
            title: "Post",
            tabBarIcon: ({ focused }) => (
              <>
                <Camera size={25} stroke={getTextCol()} fill={focused ? getTextCol() : "none"} />
                {focused && (
                  <View
                    style={{
                      position: "absolute",
                      width: 7,
                      height: 4,
                      backgroundColor: Colors.dark.text,
                      bottom: -17,
                      borderRadius: 100,
                    }}
                  ></View>
                )}
              </>
            ),
            tabBarLabel: ({ focused }) => (
              <CustomTabLabel
                color={textColor}
                text="Create"
                focused={focused}
              />
            ),
            tabBarStyle: [styles.tabBar, {
              backgroundColor: isDarkMode
                ? Colors.dark.background
                : Colors.light.background,
              borderColor: "transparent",
            }],
          }}
        />

        <Tabs.Screen
          name="messages"
          options={{
            title: "Message",
            tabBarIcon: ({ focused }) => (
              <>
                <Heart size={23} stroke={getTextCol()} fill={focused ? getTextCol() : "none"} strokeWidth={2.25} />
                {focused && (
                  <View
                    style={{
                      position: "absolute",
                      width: 7,
                      height: 4,
                      backgroundColor: mode === "light" ? Colors.light.text : Colors.dark.text,
                      bottom: -17,
                      borderRadius: 100,
                    }}
                  ></View>
                )}
              </>
            ),
            tabBarLabel: ({ focused }) => (
              <CustomTabLabel color={textColor} text="Chat" focused={focused} />
            ),
            tabBarStyle: [styles.tabBar, {
              backgroundColor: isDarkMode
                ? Colors.dark.background
                : Colors.light.background,
              borderColor: isDarkMode ? "#444" : "#ccc",
            }],
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: "Me",
            tabBarIcon: ({ focused }) => (
              <>
                <User size={25} stroke={getTextCol()} fill={focused ? getTextCol() : "none"} />
                {focused && (
                  <View
                    style={{
                      position: "absolute",
                      width: 7,
                      height: 4,
                      backgroundColor: mode === "light" ? Colors.light.text : Colors.dark.text,
                      bottom: -17,
                      borderRadius: 100,
                    }}
                  ></View>
                )}
              </>
            ),
            tabBarLabel: ({ focused }) => (
              <CustomTabLabel color={textColor} text="Me" focused={focused} />
            ),
            tabBarStyle: [styles.tabBar, {
              backgroundColor: isDarkMode
                ? Colors.dark.background
                : Colors.light.background,
              borderColor: isDarkMode ? "#444" : "#ccc",
            }],
          }}
        />
      </Tabs>

      {editing === "none" && mediaPreview && mediaPreview.length > 0 && isAddActive() && (
        <MediaActionButtons
          addMediaPreview={addMediaPreview}
          discardAllMedia={discardAllMediaPreview}
        />
      )}

      {((editing !== "none" && editing !== "crop") || (isRecording && isAddActive())) && <RecordingActionButtons />}

      {editing === "crop" &&
        <CroppingActionButtons />
      }
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 90,
    paddingTop: 14,
    elevation: 0,
    paddingHorizontal: "5%",
  },
  tabLabel: {
    marginTop: 2,
    fontSize: 10,
  },
  navbar: {
    backgroundColor: Colors.dark.background,
    height: 90,
    borderColor: "transparent",
    position: "absolute",
    bottom: 0,
    width: "100%",
    zIndex: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 12,
    paddingHorizontal: 20
  }
});
