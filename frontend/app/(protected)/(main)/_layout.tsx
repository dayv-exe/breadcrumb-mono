import { useBottomSheet } from "@/components/bottomsheet/BottomSheetContext";
import CustomButton from "@/components/buttons/CustomButton";
import ShareScreen from "@/components/inputs/ShareScreen";
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
  const { previews, showMediaPreviews, setShowMediaPreviews } = useMediaStore(useShallow(s => ({
    showMediaPreviews: s.showMediaPreviews,
    setShowMediaPreviews: s.setShowMediaPreviews,
    previews: s.mediaPreview
  })))
  const { showModal, hideModal } = useModal()
  const {openSheet, closeSheet} = useBottomSheet()
  const {height} = useWindowDimensions()
  return (
    <View
      style={styles.navbar}
    >
      {!showMediaPreviews &&
        <>
          <CustomButton
            type="text"
            slim
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
      {showMediaPreviews && <CustomButton customStyle={{ minWidth: 100 }} slim type="less-prominent" customTextStyle={{ color: "white" }} labelText="Share" imgSrc={require("../../../assets/images/icons/userlocation_sel_light.png")} handleClick={() => {
        openSheet({
          content: (
            <ShareScreen handleClose={closeSheet} title={previews.length > 1 ? "Send crumbs to..." : "Send crumb to..."} height={height} />
          ),
          reduceAnimations: true,
          fullExpansionOnOpen: true,
          snapPoints: [height],
          showHandle: false
        })
      }} />}
      {!showMediaPreviews && <CustomButton customStyle={{ minWidth: 100 }} slim handleClick={() => setShowMediaPreviews(true)} type="less-prominent" customTextStyle={{ color: "white", paddingHorizontal: 12.5 }} labelText="Edit & Share" />}
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
      <CustomButton labelText="Revert" imgSrc={require("../../../assets/images/icons/reset_unsel_light.png")} slim useMinWidth handleClick={revertCrop} />
      <Spacer size="small" />
      <CustomButton labelText="Apply" imgSrc={require("../../../assets/images/icons/check_unsel_light.png")} slim useMinWidth type="less-prominent" handleClick={applyCrop} customStyle={{backgroundColor: "#00c04b"}} />
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

  useEffect(() => {
    if (currentUser && currentUser.message) {
      setUserDetails(currentUser.message.nickname, currentUser.message.name, currentUser.message.dpUrl)
      console.log(currentUser)
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

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        initialRouteName="add"
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: isDarkMode
              ? Colors.dark.background
              : Colors.light.background,
            height: 90,
            paddingTop: 14,
            borderColor: "transparent",
          },
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
                size={24}
                focused={focused}
                darkMode={isDarkMode}
              />
            ),
            tabBarLabel: ({ focused }) => (
              <CustomTabLabel color={textColor} text="Map" focused={focused} />
            ),
            tabBarStyle: {
              backgroundColor: isDarkMode
                ? Colors.dark.background
                : Colors.light.background,
              height: 90,
              paddingTop: 14,
              borderColor: isDarkMode ? "#444" : "#ccc",
            },
          }}
        />

        <Tabs.Screen
          name="search"
          options={{
            title: "Search",
            tabBarIcon: ({ focused }) => (
              <CustomTabIcon
                name={"search"}
                size={23}
                focused={focused}
                darkMode={isDarkMode}
              />
            ),
            tabBarLabel: ({ focused }) => (
              <CustomTabLabel
                color={textColor}
                text="Search"
                focused={focused}
              />
            ),
            tabBarStyle: {
              backgroundColor: isDarkMode
                ? Colors.dark.background
                : Colors.light.background,
              height: 90,
              paddingTop: 14,
              borderColor: isDarkMode ? "#444" : "#ccc",
            },
          }}
        />

        <Tabs.Screen
          name="add"
          options={{
            title: "Post",
            tabBarIcon: ({ focused }) => (
              <CustomTabIcon
                name={"add"}
                focused={focused}
                size={23}
                darkMode={isDarkMode}
              />
            ),
            tabBarLabel: ({ focused }) => (
              <CustomTabLabel
                color={textColor}
                text="Create"
                focused={focused}
              />
            ),
            tabBarStyle: {
              backgroundColor: "#000",
              height: 90,
              paddingTop: 14,
              borderColor: "transparent",
            },
          }}
        />

        <Tabs.Screen
          name="messages"
          options={{
            title: "Message",
            tabBarIcon: ({ focused }) => (
              <CustomTabIcon
                name={"notifications"}
                focused={focused}
                darkMode={isDarkMode}
              />
            ),
            tabBarLabel: ({ focused }) => (
              <CustomTabLabel color={textColor} text="Chat" focused={focused} />
            ),
            tabBarStyle: {
              backgroundColor: isDarkMode
                ? Colors.dark.background
                : Colors.light.background,
              height: 90,
              paddingTop: 14,
              borderColor: isDarkMode ? "#444" : "#ccc",
            },
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: "Me",
            tabBarIcon: ({ focused }) => (
              <CustomTabIcon
                name={"profile"}
                focused={focused}
                darkMode={isDarkMode}
              />
            ),
            tabBarLabel: ({ focused }) => (
              <CustomTabLabel color={textColor} text="Me" focused={focused} />
            ),
            tabBarStyle: {
              backgroundColor: isDarkMode
                ? Colors.dark.background
                : Colors.light.background,
              height: 90,
              paddingTop: 14,
              borderColor: isDarkMode ? "#444" : "#ccc",
            },
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
  tabLabel: {
    marginTop: 2,
    fontSize: 10,
  },
  navbar: {
    backgroundColor: "#000",
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
