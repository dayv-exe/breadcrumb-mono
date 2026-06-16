import { SelectedLocation } from "@/api/models/locationTypes";
import { convertCoordinatesToNumberTuple } from "@/constants/mapFunctions";
import { useMap } from "@/hooks/useMap";
import { usePlaceSearchRetrieve } from "@/hooks/usePlaceSearchRetrieve";
import { usePlaceSearchSuggest } from "@/hooks/usePlaceSearchSuggest";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Coordinates, useLocationStore } from "@/utils/useLocationStore";
import Mapbox from "@rnmapbox/maps";
import React, { useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { v4 as GenerateUUID } from "uuid";
import CustomButton from "../buttons/CustomButton";
import CustomFloatingSquare from "../buttons/CustomFloatingSquare";
import CustomImageButton from "../buttons/CustomImageButton";
import CustomLabel from "../CustomLabel";
import CustomMap from "../map/CustomMap";
import RadiusSlider from "../map/RadiusSlider";
import Spacer from "../Spacer";
import { ElevatedSectionedScrollView } from "../views/ElevatedSectionedScrollView";
import CustomSearchInput from "./CustomSearchInput";

interface props {
  selectedLocation: SelectedLocation | null
  setSelectedLocation: (l: SelectedLocation) => void
  onCancel: () => void
  onLocationSelected: (l: SelectedLocation) => void
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

export default function ChooseOnMap({ onCancel, onLocationSelected, selectedLocation, setSelectedLocation, }: props) {
  const [sessionToken] = useState(() => GenerateUUID())
  const insets = useSafeAreaInsets()
  const searchRef = useRef(null)

  const mapRef = useRef<Mapbox.MapView>(null)
  const camRef = useRef<Mapbox.Camera>(null)
  const [useSatellite, setUseSatellite] = useState(false)
  const bgCol = useThemeColor({}, "background")

  const userlocation = useLocationStore(s => s.coordinates)
  const containerRef = useRef(null)

  const [mapCenter, setMapCenter] = useState<Coordinates | null>(null)

  const {
    selectedLocation: mapSelLocation,
    setSelectedLocation: setMapSelLocation,
    focusOnPoi,
    focusOnDroppedPin,
    is2dButtonVisible,
    lock2DButtonAsHidden,
    set2dButtonVisible,
    allowAutoPitch,
    focusOnUserLocation,
    setDroppedPinRadius,
    focusOnCoords,
    focusOnSearchResult,
    make2d,
  } = useMap(
    mapRef,
    camRef,
    selectedLocation
  )

  const {
    clearSearchResult,
    searchResult,
    setPlaceId,
  } = usePlaceSearchRetrieve(
    sessionToken,
    userlocation ?? { accuracy: 0, latitude: 0, longitude: 0 },
    p => {
      setMapSelLocation(null)
      focusOnSearchResult(p)
    },
  )

  const {
    search,
    setSearch,
    places,
    searchFailed,
    searchPending,
    sections,
  } = usePlaceSearchSuggest(
    sessionToken,
    mapCenter,
    userlocation ?? { accuracy: 0, latitude: 0, longitude: 0 },
    p => {
      setSearch("")
      setPlaceId(p)
    },
  )


  return (
    <View style={styles.container}>
      <View style={{
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
      }}>
        <View ref={containerRef} style={[styles.tools, {
          top: insets.top
        }]}>
          <CustomSearchInput solidAppearance placeholder="Search places..." customStyle={[styles.searchBar, {
          }]} ref={searchRef} handleChange={setSearch} value={search} />
          <Spacer size="small" />
          <CustomButton customStyle={[
            styles.cancelBtn, {
              backgroundColor: "red"
            }
          ]} slim labelText="Cancel" type="less-prominent" handleClick={onCancel} />
        </View>
        {search.length > 0 && places && places?.length > 0 && <View style={{
          flexGrow: 1,
          flexShrink: 1,
          position: "absolute",
          top: insets.top + 50,
          zIndex: 2000,
        }}>
          <ElevatedSectionedScrollView sections={sections} hideSectionTitles />
        </View>}
        {searchPending && !searchFailed && <ActivityIndicator size={40} style={{
          position: "absolute",
          top: insets.top + 60,
          zIndex: 2000
        }} />}
      </View>
      <CustomMap
        useSatellite={useSatellite}
        mapRef={mapRef}
        cameraRef={camRef}
        onPoiSelect={focusOnPoi}
        onDroppedPin={focusOnDroppedPin}
        onMapPress={clearSearchResult}
        onMapLongPress={clearSearchResult}
        selectedLocation={mapSelLocation}
        centerCoordinate={mapSelLocation && mapSelLocation.type === "poi" ? convertCoordinatesToNumberTuple(mapSelLocation.coordinates) : mapSelLocation && mapSelLocation.type === "pin" ? convertCoordinatesToNumberTuple(mapSelLocation.coordinates) : undefined}
        is2dButtonVisible={is2dButtonVisible}
        set2dButtonVisible={set2dButtonVisible}
        lock2dButtonAsHidden={lock2DButtonAsHidden}
        allowAutoPitch={allowAutoPitch}
        onMapReady={() => {
          if (mapSelLocation && mapSelLocation.type === "poi") focusOnPoi(mapSelLocation.poi)
          else if (mapSelLocation && mapSelLocation.type === "pin") focusOnDroppedPin(convertCoordinatesToNumberTuple(mapSelLocation.coordinates))
        }}
        searchResult={searchResult}
        setMapCenter={setMapCenter}
      />

      <View style={[styles.controlsContainer, {
        bottom: insets.bottom + 130,
      }]}>
        {is2dButtonVisible && <>
          <CustomFloatingSquare type="themed" handleClick={() => {
            make2d()
          }}>
            <CustomLabel labelText="2D" adaptToTheme customStyle={{ padding: 0 }} textAlign="center" />
          </CustomFloatingSquare>
          <Spacer size="small" />
        </>}
        <CustomImageButton size={21} src={getIconImage("satellite", true)} handleClick={() => setUseSatellite(s => !s)} />
        <Spacer size="small" />
        <CustomImageButton size={21} src={getIconImage("focusUserLoc", true)} handleClick={focusOnUserLocation} />
      </View>

      <View style={[styles.bottomSheet, { bottom: 0, backgroundColor: bgCol, minHeight: 100 }]}>
        {!mapSelLocation && <CustomLabel adaptToTheme labelText={`Tap on a label or long press any where to select a location`} fade />}
        {mapSelLocation && mapSelLocation.type === "poi" &&
          <>
            <View style={{
              flexGrow: 1,
              flexShrink: 1,
              alignItems: "flex-start",
              justifyContent: "flex-start",
              flexDirection: 'column',
            }}>
              <TouchableOpacity onPress={() => {
                focusOnPoi(mapSelLocation.poi)
              }}>
                <CustomLabel adaptToTheme labelText={(mapSelLocation.poi.properties as any).name ?? (mapSelLocation.poi.properties as any).house_num} customStyle={{ padding: 0 }} allowTruncate textAlign="left" />
                <CustomLabel adaptToTheme fade fontSize={13} labelText={(mapSelLocation.poi.properties as any).type ?? (mapSelLocation.poi.properties as any).maki} customStyle={{ padding: 0 }} />
              </TouchableOpacity>
            </View>
            <CustomButton handleClick={() => {
              setSelectedLocation(mapSelLocation)
              onLocationSelected(mapSelLocation)
            }} type="less-prominent" labelText="Select" slim useMinWidth />
          </>
        }
        {mapSelLocation && mapSelLocation.type === "pin" &&
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
              <CustomLabel adaptToTheme fade fontSize={15} labelText={`Lat: ${mapSelLocation.coordinates.latitude}`} customStyle={{ padding: 0 }} />
              <CustomLabel adaptToTheme fade fontSize={15} labelText={`Lon: ${mapSelLocation.coordinates.longitude}`} customStyle={{ padding: 0 }} />
              <RadiusSlider hapticsEnabled maximumValue={100} minimumValue={15} unit="m" step={5} label="Visibility radius: " value={mapSelLocation.radius ?? 15} onValueChange={r => {
                setDroppedPinRadius(r)
              }} />
            </View>
            <CustomButton handleClick={() => {
              setSelectedLocation(mapSelLocation)
              onLocationSelected(mapSelLocation)
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
    width: "100%",
    paddingHorizontal: 15,
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
    shadowOpacity: .275,
    shadowRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  }
})