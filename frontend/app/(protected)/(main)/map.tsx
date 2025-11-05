import { useBottomSheet } from "@/components/bottomsheet/BottomSheetContext";
import CustomButton from "@/components/buttons/CustomButton";
import CustomImageButton from "@/components/buttons/CustomImageButton";
import CustomLabel from "@/components/CustomLabel";
import CustomMap, { mapMethods } from "@/components/map/CustomMap";
import Spacer from "@/components/Spacer";
import { Colors } from "@/constants/Colors";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useLocationStore } from "@/utils/useLocationStore";
import Mapbox from "@rnmapbox/maps";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { ScrollView, StyleSheet, useColorScheme, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const token = Constants.expoConfig?.extra?.mapboxToken;
if (!token) {
  console.warn("Mapbox token is missing!");
} else {
  Mapbox.setAccessToken(token);
}

const icons = {
  addFriend: {
    light: require("../../../assets/images/icons/searchfriends_sel_light.png"),
    dark: require("../../../assets/images/icons/searchfriends_sel_dark.png")
  },
  frameMap: {
    light: require("../../../assets/images/icons/frame_unsel_light.png"),
    dark: require("../../../assets/images/icons/frame_unsel_dark.png")
  },
  focusUserLoc: {
    light: require("../../../assets/images/icons/userlocation_sel_light.png"),
    dark: require("../../../assets/images/icons/userlocation_sel_dark.png")
  },
  mapToggle: {
    light: require("../../../assets/images/icons/maptoggle_sel_light.png"),
    dark: require("../../../assets/images/icons/maptoggle_sel_dark.png")
  },
  search: {
    light: require("../../../assets/images/icons/thicksearch_unsel_light.png"),
    dark: require("../../../assets/images/icons/thicksearch_unsel_dark.png")
  },
  addCrumb: {
    light: require("../../../assets/images/icons/add_sel_light.png"),
    dark: require("../../../assets/images/icons/add_sel_dark.png")
  },
  wall: {
    light: require("../../../assets/images/icons/walls_sel_light.png"),
    dark: require("../../../assets/images/icons/walls_sel_dark.png")
  },
  close: {
    light: require("../../../assets/images/icons/close_unsel_light.png"),
    dark: require("../../../assets/images/icons/close_unsel_dark.png")
  }
}

export function getIconImage(name: keyof typeof icons, darkMode: boolean) {
  const theme = darkMode ? "dark" : "light"
  return icons[name][theme]
}

export default function MapScreen() {
  const mode = useColorScheme() ?? "light";
  const mapRef = useRef<Mapbox.MapView>(null);
  const bgCol = useThemeColor({}, "background")
  const [mapMethods, setMapMethods] = useState<mapMethods | null>(null)
  const router = useRouter()
  const { coordinates } = useLocationStore()
  const { openSheet } = useBottomSheet()

  function handleAddFriend() {
    router.push("/find-friends")
  }


  return (
    <View style={[styles.page, { backgroundColor: bgCol }]}>

      <SafeAreaView pointerEvents="box-none" style={[styles.headerWrapper]}>
        <View>
          <CustomImageButton src={getIconImage("addFriend", mode === "light")} handleClick={handleAddFriend} />
        </View>
        <View style={[styles.headerTextContainer, { backgroundColor: mode === "dark" ? Colors.dark.background : Colors.light.background }]}>
          <CustomLabel adaptToTheme labelText="map" />
        </View>
        <View>
          <CustomImageButton handleClick={() => {
            const curCoord = useLocationStore.getState().coordinates
            mapMethods?.moveTo([curCoord?.longitude ?? 0, curCoord?.latitude ?? 0], 13)
          }} src={getIconImage("focusUserLoc", mode === "light")} />
          <Spacer size="small" />
          <CustomImageButton src={getIconImage("search", mode === "light")} />
          <Spacer size="small" />
          <CustomImageButton src={getIconImage("frameMap", mode === "light")} />
          <Spacer size="small" />
        </View>
      </SafeAreaView>

      <CustomMap setMapMethods={setMapMethods} mapRef={mapRef} zoomLevel={12.5} useSatellite={false} handlePress={() => {
        openSheet({
          content: (

            <View style={{ height: 200 }}>
              <CustomLabel labelText="Test" adaptToTheme bold />
            </View>
          ),
          showOverlay: true,
          dynamicHeight: true
        })
      }} />

      <View>
        <View style={[styles.bottomSheet, {
          backgroundColor: bgCol,
          position: "absolute",
          bottom: 0,
          width: "100%",
          alignItems: "center",
          justifyContent: "flex-start",
          flexDirection: "row",
          padding: 20,
          paddingTop: 17,
          paddingBottom: 15,
        }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <CustomButton labelText="📬 Unopened" customTextStyle={{ fontWeight: "400" }} squashed type="theme-faded" />
            <Spacer size="small" />
            <CustomButton labelText="🧱 Walls" customTextStyle={{ fontWeight: "400" }} squashed type="theme-faded" />
            <Spacer size="small" />
            <CustomButton labelText="🕖 Recent" customTextStyle={{ fontWeight: "400" }} squashed type="theme-faded" />
            <Spacer size="small" />
            <CustomButton labelText="👀 Me" customTextStyle={{ fontWeight: "400" }} squashed type="theme-faded" />
            <Spacer size="small" />
            <CustomButton labelText="📍Nearby" customTextStyle={{ fontWeight: "400" }} squashed type="theme-faded" />
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    position: "absolute",
    marginTop: 10,
    top: 0,
    left: 15,
    right: 15,
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexDirection: "row",
    zIndex: 10,
  },
  headerText: {
    fontSize: 16
  },
  headerTextContainer: {
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderRadius: 15,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: .275,
    shadowRadius: 10,
    zIndex: 10
  },
  page: {
    flex: 1,
  },
  bottomSheet: {
    borderTopLeftRadius: 23,
    borderTopRightRadius: 23,
    shadowRadius: 7,
    shadowOpacity: .175,
    elevation: 4,
  }
});
