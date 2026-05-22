import { useSelectLocation } from "@/hooks/useSelectLocation";
import { useThemeColor } from "@/hooks/useThemeColor";
import Mapbox from "@rnmapbox/maps";
import type { Feature, GeoJsonProperties, Geometry } from "geojson";
import React, { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomButton from "../buttons/CustomButton";
import CustomFloatingSquare from "../buttons/CustomFloatingSquare";
import CustomImageButton from "../buttons/CustomImageButton";
import CustomLabel from "../CustomLabel";
import CustomMap from "../map/CustomMap";
import RadiusSlider from "../map/RadiusSlider";
import Spacer from "../Spacer";
import CustomSearchInput from "./CustomSearchInput";

interface props {
  inheritedDroppedPin: [number, number] | null
  inheritedDroppedPinRadius: number
  setIDroppedPinRadius: (r: number) => void
  inheritedSelectedPoi: Feature<Geometry, GeoJsonProperties> | null
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

export default function ChooseOnMap({ handleCancel, handleChooseLocation, handleDroppedPin, inheritedDroppedPin, inheritedDroppedPinRadius, inheritedSelectedPoi, setIDroppedPinRadius }: props) {
  const insets = useSafeAreaInsets()
  const searchRef = useRef(null)
  const [searchStr, setSearchStr] = useState("")

  const mapRef = useRef<Mapbox.MapView>(null)
  const camRef = useRef<Mapbox.Camera>(null)
  const [useSatellite, setUseSatellite] = useState(false)
  const bgCol = useThemeColor({}, "background")

  const {
    droppedPin,
    selectedPoi,
    focusOnPoi,
    focusOnDroppedPin,
    is2dButtonVisible,
    lock2DButtonAsHidden,
    set2dButtonVisible,
    allowAutoPitch,
    setAllowAutoPitch,
    droppedPinRadius,
    focusOnUserLocation,
    setDroppedPinRadius,
    setLockButtonAsHidden,
  } = useSelectLocation(mapRef, camRef, inheritedDroppedPin ?? undefined, inheritedDroppedPinRadius, inheritedSelectedPoi ?? undefined)

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
      <CustomMap
        useSatellite={useSatellite}
        mapRef={mapRef}
        cameraRef={camRef}
        activePoi={selectedPoi}
        onPoiSelect={focusOnPoi}
        dropPinCoord={droppedPin}
        onDroppedPin={focusOnDroppedPin}
        centerCoordinate={selectedPoi ? (selectedPoi.geometry as any).coordinates : droppedPin ? droppedPin : undefined}
        is2dButtonVisible={is2dButtonVisible} set2dButtonVisible={(s) => {
          set2dButtonVisible(s)
          if (!s) setLockButtonAsHidden(false)
        }}
        allowAutoPitch={allowAutoPitch} droppedPinRadius={droppedPinRadius}
        onMapReady={() => {
          if (selectedPoi) focusOnPoi(selectedPoi)
          else if (droppedPin) focusOnDroppedPin(droppedPin)
        }}
      />

      <View style={[styles.controlsContainer, {
        bottom: insets.bottom + 130,
      }]}>
        {is2dButtonVisible && !lock2DButtonAsHidden && <>
          <CustomFloatingSquare type="themed" handleClick={() => {
            setLockButtonAsHidden(true)
            set2dButtonVisible(false)
            if (selectedPoi || droppedPin) setAllowAutoPitch(false)
            camRef.current?.setCamera({
              pitch: 0,
              animationDuration: 300,
              animationMode: "easeTo",
            })
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
        {!selectedPoi && !droppedPin && <CustomLabel adaptToTheme labelText={`Tap on a label or long press any where to select a location`} fade />}
        {selectedPoi &&
          <>
            <View style={{
              flexGrow: 1,
              flexShrink: 1,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: 'column',
            }}>
              <CustomLabel adaptToTheme labelText={(selectedPoi.properties as any).name ?? (selectedPoi.properties as any).house_num} customStyle={{ padding: 0 }} allowTruncate />
              <CustomLabel adaptToTheme fade fontSize={13} labelText={(selectedPoi.properties as any).type ?? (selectedPoi.properties as any).maki} customStyle={{ padding: 0 }} />
            </View>
            <CustomButton handleClick={() => {
              handleChooseLocation(selectedPoi)
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
              <RadiusSlider hapticsEnabled maximumValue={100} minimumValue={15} unit="m" step={5} label="Visibility radius: " value={droppedPinRadius} onValueChange={r => {
                setDroppedPinRadius(r)
              }} />
            </View>
            <CustomButton handleClick={() => {
              setDroppedPinRadius(droppedPinRadius)
              setIDroppedPinRadius(droppedPinRadius)
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