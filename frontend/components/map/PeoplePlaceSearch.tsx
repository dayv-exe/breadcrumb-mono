import { convertNumberTupleToCoordinates } from "@/constants/mapFunctions";
import { usePlaceSearchSuggest } from "@/hooks/usePlaceSearchSuggest";
import { useSearchUser } from "@/hooks/useSearchUser";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Coordinates, useLocationStore } from "@/utils/useLocationStore";
import Mapbox from "@rnmapbox/maps";
import { ChevronDown } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, TextInput, View } from "react-native";
import CustomFloatingSquare from "../buttons/CustomFloatingSquare";
import CustomLabel from "../CustomLabel";
import CustomSearchInput from "../inputs/CustomSearchInput";
import Spacer from "../Spacer";
import { ElevatedSectionedScrollView } from "../views/ElevatedSectionedScrollView";

interface props {
  OnPlaceSelect?: (placeId: string) => void
  OnClose?: () => void
  HandleClosePress?: () => void
  mapRef: React.RefObject<Mapbox.MapView | null>
  availableHeight?: number
  sessionToken: string
}

export default function PeoplePlaceSearch({ HandleClosePress, availableHeight, OnClose, OnPlaceSelect, sessionToken, mapRef }: props) {
  const [mapCenter, setMapCenter] = useState<Coordinates>({ accuracy: 0, latitude: 0, longitude: 0 })
  const searchInput = useRef<TextInput>(null)
  const textCol = useThemeColor({}, "text")
  const bgCol = useThemeColor({}, "darkBackground")
  const normBgCol = useThemeColor({}, "background")
  const {
    setSearch: setSearchPlaceStr,
    search: placeSearch,
    searchFailed: placeSearchFailed,
    searchPending: placeSearchPending,
    places: placesSearchResult,
    section: placeSearchSection,
  } = usePlaceSearchSuggest(
    sessionToken,
    useLocationStore.getState().coordinates ?? { accuracy: 0, latitude: 0, longitude: 0 },
    mapCenter,
    p => {
      OnPlaceSelect?.(p)
    }
  )

  const {
    searchError: userSearchError,
    searchFailed: userSearchFailed,
    searchPending: userSearchPending,
    searchStr: userSearchStr,
    section: userSearchSection,
    setSearchStr: setUserSearchStr,
    users: userSearchResult,
  } = useSearchUser()

  const sections = [userSearchSection, placeSearchSection]

  useEffect(() => {
    searchInput.current?.focus()
    const getMapCenter = async () => {
      if (!mapRef.current) return
      const c = await mapRef.current.getCenter()
      setMapCenter(convertNumberTupleToCoordinates(
        [c[0] ?? 0, c[1] ?? 0]
      ))
    }

    getMapCenter()
  }, [mapRef])

  return (
    <View style={[
      styles.container,
      {
        height: availableHeight,
        paddingTop: 10,
        backgroundColor: bgCol
      }
    ]}>
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 15,
      }}>
        <CustomSearchInput ref={searchInput} handleChange={e => {
          setUserSearchStr(e)
          setSearchPlaceStr(e)
        }} value={userSearchStr} placeholder="places or people you know" />
        <Spacer size="small" />
        {HandleClosePress && <CustomFloatingSquare handleClick={HandleClosePress} isFlat customStyle={{
          backgroundColor: "transparent",
          width: 30,
          height: 30
        }}>
          <ChevronDown color={textCol} strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} />
        </CustomFloatingSquare>}
      </View>
      {
        placeSearchFailed || userSearchFailed &&
        <View
          style={{
            paddingHorizontal: 15,
          }}
        >
          <Spacer />
          <CustomLabel labelText="🤔" fontSize={32} />
          <CustomLabel adaptToTheme fade labelText={`Hmmm...\nsomething is not quite right here`} />
        </View>
      }

      {userSearchStr.length > 0 && ((userSearchResult?.length ?? 0) > 0 || (placesSearchResult?.length ?? 0) > 0) &&
        <>
          <Spacer />
          <ElevatedSectionedScrollView sections={sections} style={{ padding: 0, margin: 0, shadowRadius: 0 }} />
        </>
      }

      {
        userSearchPending || placeSearchPending &&
        <>
          <Spacer />
          <ActivityIndicator />
        </>
      }

      {
        userSearchStr.length > 0 && (placesSearchResult?.length ?? 0) < 1 && (userSearchResult?.length ?? 0) < 1 && (!userSearchPending && !placeSearchPending) &&
        <View style={{
          paddingHorizontal: 15,
        }}>
          <Spacer />
          <CustomLabel labelText="🕵️‍♀️" fontSize={32} />
          <CustomLabel adaptToTheme fade labelText={`No results`} />
        </View>
      }
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
})