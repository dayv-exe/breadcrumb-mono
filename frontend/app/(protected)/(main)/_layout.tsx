import CustomButton from "@/components/buttons/CustomButton";
import { Colors } from "@/constants/Colors";
import { MediaData } from "@/constants/media";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useMediaStore } from "@/utils/mediaStore";
import { Tabs, useSegments } from "expo-router";
import { ColorValue, Image, StyleSheet, Text, View } from "react-native";

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

export function getIconImage(
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
  return (
    <View
      style={{
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
        paddingBottom: 20,
      }}
    >
      <CustomButton
        type="text"
        labelText={"Discard"}
        handleClick={() => discardAllMedia()}
      />
      <CustomButton type="prominent" labelText="Share" />
    </View>
  );
}

function RecordingActionButtons() {
  return (
    <View
      style={{
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
      }}
    ></View>
  );
}

export default function MainScreen() {
  const { isRecording, mediaPreview, addMediaPreview, discardAllMediaPreview } =
    useMediaStore();
  const segments = useSegments();
  const mode = useColorScheme();
  const textColor = useThemeColor({}, "text");

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

      {mediaPreview && mediaPreview.length > 0 && isAddActive() && (
        <MediaActionButtons
          addMediaPreview={addMediaPreview}
          discardAllMedia={discardAllMediaPreview}
        />
      )}

      {isRecording && isAddActive() && <RecordingActionButtons />}
    </View>
  );
}

const styles = StyleSheet.create({
  tabLabel: {
    marginTop: 2,
    fontSize: 10,
  },
});
