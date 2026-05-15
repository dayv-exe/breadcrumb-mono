import { useThemeColor } from "@/hooks/useThemeColor";
import { useLocationStore } from "@/utils/useLocationStore";
import Mapbox from "@rnmapbox/maps";
import type { Feature, GeoJsonProperties, Geometry } from "geojson";
import { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomButton from "../buttons/CustomButton";
import CustomImageButton from "../buttons/CustomImageButton";
import CustomLabel from "../CustomLabel";
import CustomMap from "../map/CustomMap2";
import Spacer from "../Spacer";
import CustomSearchInput from "./CustomSearchInput";

interface props {
  droppedPinCoord: [number, number] | null
  selectedPoi: Feature<Geometry, GeoJsonProperties> | null
  handleCancel: () => void
  handleChooseLocation: (p: Feature<Geometry, GeoJsonProperties> | null) => void
  handleDroppedPin: (coords: [number, number]) => void
}

const icons = {
  focusUserLoc: {
    light: require("../../assets/images/icons/userlocation_sel_light.png"),
    dark: require("../../assets/images/icons/userlocation_sel_dark.png")
  },
  mapToggle: {
    light: require("../../assets/images/icons/maptoggle_sel_light.png"),
    dark: require("../../assets/images/icons/maptoggle_sel_dark.png")
  },
  satellite: {
    light: require("../../assets/images/icons/satellite_sel_light.png"),
    dark: require("../../assets/images/icons/satellite_sel_dark.png")
  },
}

function getIconImage(name: keyof typeof icons, darkMode: boolean) {
  const theme = darkMode ? "dark" : "light"
  return icons[name][theme]
}

export default function ChooseOnMap({ selectedPoi, droppedPinCoord, handleCancel, handleChooseLocation, handleDroppedPin }: props) {
  const insets = useSafeAreaInsets()

  const [activePoi, setActivePoi] = useState<Feature<Geometry, GeoJsonProperties> | null>(selectedPoi)
  const [droppedPin, setDroppedPin] = useState<[number, number] | null>(droppedPinCoord)

  const searchRef = useRef(null)
  const [searchStr, setSearchStr] = useState("")

  const mapRef = useRef<Mapbox.MapView>(null)
  const camRef = useRef<Mapbox.Camera>(null)
  const [useSatellite, setUseSatellite] = useState(false)
  const bgCol = useThemeColor({}, "background")

  const coords = useLocationStore(s => s.coordinates)
  const focusOnUser = () => {
    camRef.current?.setCamera({
      centerCoordinate: [coords?.longitude ?? 0, coords?.latitude ?? 0],
      zoomLevel: 12.5,
      animationDuration: 1000,
      pitch: 0,
      heading: 0,
    })
  }

  return (
    <View style={styles.container}>
      <View style={[styles.tools, {
        top: insets.top
      }]}>
        <CustomSearchInput solidAppearance placeholder="Search places..." customStyle={[styles.searchBar, {
        }]} ref={searchRef} handleChange={setSearchStr} value={searchStr} />
        <Spacer size="small" />
        <CustomButton customStyle={[
          styles.cancelBtn, {
            backgroundColor: "red"
          }
        ]} slim labelText="Cancel" type="less-prominent" handleClick={handleCancel} />
      </View>
      <CustomMap useSatellite={useSatellite} mapRef={mapRef} cameraRef={camRef} activePoi={activePoi} setActivePoi={setActivePoi} dropPinCoord={droppedPin} setDropPinCoord={setDroppedPin} />

      <View style={[styles.controlsContainer, {
        bottom: insets.bottom + 130,
      }]}>
        <CustomImageButton size={21} src={getIconImage("satellite", true)} handleClick={() => setUseSatellite(s => !s)} />
        <Spacer size="small" />
        <CustomImageButton size={21} src={getIconImage("focusUserLoc", true)} handleClick={focusOnUser} />
      </View>

      <View style={[styles.bottomSheet, { bottom: 0, backgroundColor: bgCol, minHeight: 100 }]}>
        {!activePoi && !droppedPin && <CustomLabel adaptToTheme labelText={`Tap on a label or long press any where to select a location`} fade />}
        {activePoi &&
          <>
            <View style={{
              flexGrow: 1,
              flexShrink: 1,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: 'column',
            }}>
              <CustomLabel adaptToTheme labelText={(activePoi.properties as any).name} customStyle={{ padding: 0 }} allowTruncate />
              <CustomLabel adaptToTheme fade fontSize={13} labelText={(activePoi.properties as any).type ?? (activePoi.properties as any).maki} customStyle={{ padding: 0 }} />
            </View>
            <CustomButton handleClick={() => {
              setDroppedPin(droppedPin)
              handleChooseLocation(activePoi)
            }} type="less-prominent" labelText="Select" slim useMinWidth />
          </>
        }
        {droppedPin &&
          <>
            <View style={{
              flexGrow: 1,
              flexShrink: 1,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: 'column',
            }}>
              <CustomLabel adaptToTheme labelText="Dropped pin" customStyle={{ padding: 0 }} allowTruncate />
              <Spacer size="small" />
              <CustomLabel adaptToTheme fade fontSize={15} labelText={`Lat: ${droppedPin[1]}`} customStyle={{ padding: 0 }} />
              <CustomLabel adaptToTheme fade fontSize={15} labelText={`Lon: ${droppedPin[0]}`} customStyle={{ padding: 0 }} />
            </View>
            <CustomButton handleClick={() => {
              setActivePoi(activePoi)
              handleDroppedPin(droppedPin)
            }} type="less-prominent" labelText="Select" slim useMinWidth />
          </>
        }
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  map: {
    flex: 1,
  },

  tools: {
    alignSelf: "center",
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "95%",
  },

  cancelBtn: {
    zIndex: 1000
  },

  searchBar: {
    zIndex: 1000,
  },

  controlsContainer: {
    position: "absolute",
    right: 15
  },

  bottomSheet: {
    position: "absolute",
    width: "100%",
    paddingHorizontal: 25,
    paddingVertical: 15,
    paddingBottom: 50,
    zIndex: 1000,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  }
})