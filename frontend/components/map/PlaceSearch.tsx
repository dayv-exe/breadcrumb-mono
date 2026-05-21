import { Suggestion } from "@/api/models/placeSearch";
import { useSearchPlace } from "@/hooks/queries/usePlacesSearchApi";
import { useThemeColor } from "@/hooks/useThemeColor";
import { debounce } from "@/utils/debounce";
import { convertToPreferredDistance } from "@/utils/helpers";
import { Coordinates } from "@/utils/useLocationStore";
import Mapbox from "@rnmapbox/maps";
import { ChevronDown, MapPin } from "lucide-react-native";
import React, { RefObject, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import CustomFloatingSquare from "../buttons/CustomFloatingSquare";
import CustomLabel from "../CustomLabel";
import CustomSearchInput from "../inputs/CustomSearchInput";
import Spacer from "../Spacer";
import { ElevatedSectionedScrollView, Section } from "../views/ElevatedSectionedScrollView";

interface props {
  OnPlaceSelect?: (placeId: string) => void
  OnClose?: () => void
  HandleClosePress?: () => void
  mapRef: RefObject<Mapbox.MapView | null>
  userLocation: Coordinates | null
  availableHeight?: number
  sessionToken: string
}

const SearchResult = ({ place, onSelect }: { place: Suggestion, onSelect: (pId: string) => void }) => {
  return (
    <TouchableOpacity style={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      width: "100%",
      paddingVertical: 7,
      paddingHorizontal: 5,
    }}
      onPress={() => {
        onSelect(place.mapbox_id)
      }}
    >
      <View style={{
        backgroundColor: "rgba(0, 0, 0, .05)",
        borderRadius: "100%",
        padding: 10,
      }}>
        <MapPin strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" color={"rgba(0, 0, 0, .35)"} />
      </View>
      <View style={{ flexGrow: 1, flexShrink: 1, }}>
        <CustomLabel labelText={place.name} adaptToTheme fontSize={15} />
        <CustomLabel allowTruncate fade labelText={convertToPreferredDistance(place.distance ?? 0) + " • " + (place.full_address ?? place.place_formatted)} adaptToTheme fontSize={14} customStyle={{
          paddingVertical: 0,
        }} />
      </View>
    </TouchableOpacity>
  )
}

export default function PlaceSearch({ HandleClosePress, availableHeight, mapRef, userLocation, OnClose, OnPlaceSelect, sessionToken }: props) {
  const searchInput = useRef<TextInput>(null)
  const [search, setSearch] = useState("")
  const textCol = useThemeColor({}, "text")
  const fadedBgCol = useThemeColor({}, "fadedBackgroundElevated")
  const bgCol = useThemeColor({}, "darkBackground")
  const [mapCenter, setMapCenter] = useState<Coordinates>({ accuracy: 0, latitude: 0, longitude: 0 })
  const userLoc = userLocation ?? { accuracy: 0, latitude: 0, longitude: 0 }
  const [debouncedSearchStr, setDebouncedSearchStr] = useState("")

  const debounceInput = useMemo(() => {
    return debounce((value: string) => {
      setDebouncedSearchStr(value);
    }, 300);
  }, []);

  useEffect(() => {
    searchInput.current?.focus()

    const getMapCenter = async () => {
      const c = await mapRef.current?.getCenter()
      setMapCenter({ accuracy: 0, latitude: c?.[1] ?? 0, longitude: c?.[0] ?? 0 })
    }

    getMapCenter()
  }, [mapRef])

  const { data: searchResponse, isError: searchFailed, isFetching: searchPending } = useSearchPlace(sessionToken, debouncedSearchStr, mapCenter, userLoc)

  const places = searchResponse?.suggestions

  const sections: Section[] = [
    {
      key: "places",
      type: "paginated",
      title: "Results",
      data: places ?? [],
      hasMore: false,
      isFetchingMore: searchPending,
      keyExtractor: (place: Suggestion) => place.mapbox_id,
      renderItem: (place: Suggestion) => (
        <SearchResult place={place} onSelect={p => OnPlaceSelect?.(p)} />
      ),
      onEndReached: () => { }
    },
  ]

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
          debounceInput(e)
          setSearch(e)
        }} value={search} placeholder="Find a place" />
        <Spacer size="small" />
        {HandleClosePress && <CustomFloatingSquare handleClick={HandleClosePress} isFlat customStyle={{
          backgroundColor: "transparent",
          width: 35,
          height: 30
        }}>
          <ChevronDown color={textCol} strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} />
        </CustomFloatingSquare>}
      </View>
      {
        searchFailed &&
        <>
          <Spacer />
          <CustomLabel labelText="🤔" fontSize={32} />
          <CustomLabel adaptToTheme fade labelText={`Hmmm...\nsomething is not quite right here`} />
        </>
      }

      {
        searchPending && !searchFailed &&
        <>
          <Spacer />
          <ActivityIndicator />
        </>
      }

      {
        searchResponse && places && places.length > 0 &&
        <>
          <Spacer />
          <ElevatedSectionedScrollView sections={sections} style={{ padding: 0, margin: 0 }} />
        </>
      }

      {
        searchResponse && places && places.length < 1 &&
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