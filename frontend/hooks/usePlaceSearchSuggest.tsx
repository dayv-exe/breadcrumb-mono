import { Suggestion } from "@/api/models/placeSearch";
import CustomLabel from "@/components/CustomLabel";
import { Section } from "@/components/views/ElevatedSectionedScrollView";
import { debounce } from "@/utils/debounce";
import { convertToPreferredDistance } from "@/utils/helpers";
import { Coordinates } from "@/utils/useLocationStore";
import { MapPin } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { useSearchPlace } from "./queries/usePlacesSearchApi";
import { useThemeColor } from "./useThemeColor";

const SearchResult = ({ place, onSelect }: { place: Suggestion, onSelect: (pId: string) => void }) => {
  const textCol = useThemeColor({}, "text")
  return (
    <TouchableOpacity style={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      width: "100%",
      paddingVertical: 7,
      paddingHorizontal: 5,
    }
    }
      onPress={() => {
        onSelect(place.mapbox_id)
      }}
    >
      <View style={
        {
          backgroundColor: "rgba(0, 0, 0, .05)",
          borderRadius: "100%",
          padding: 10,
        }
      }>
        <MapPin strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" color={textCol} opacity={.7} />
      </View>
      < View style={{ flexGrow: 1, flexShrink: 1, }}>
        <CustomLabel labelText={place.name} adaptToTheme fontSize={15} />
        <CustomLabel allowTruncate fade labelText={convertToPreferredDistance(place.distance ?? 0) + " • " + (place.full_address ?? place.place_formatted)} adaptToTheme fontSize={14} customStyle={{
          paddingVertical: 0,
        }} />
      </View>
    </TouchableOpacity>
  )
}

type UsePlaceSuggestionReturns = {
  searchFailed: boolean
  searchPending: boolean
  sections: Section[]
  places: Suggestion[] | undefined
  search: string
  setSearch: (s: string) => void
}

export const usePlaceSearchSuggest = (sessionToken: string, mapCenter: Coordinates | null, userlocation: Coordinates, OnPlaceSelect: (placeId: string) => void): UsePlaceSuggestionReturns => {
  const [searchStr, setSearchStr] = useState("")
  const [debouncedSearchStr, setDebouncedSearchStr] = useState("")

  const debounceInput = useMemo(() => {
    return debounce((value: string) => {
      setDebouncedSearchStr(value);
    }, 500);
  }, []);

  const { data: searchResponse, isError: searchFailed, isFetching: searchPending } = useSearchPlace(sessionToken, debouncedSearchStr, (mapCenter), userlocation)

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
        <SearchResult place={place} onSelect={p => OnPlaceSelect(p)} />
      ),
      onEndReached: () => { }
    },
  ]

  return {
    searchFailed,
    searchPending,
    sections,
    places,
    search: searchStr,
    setSearch: s => {
      setSearchStr(s)
      debounceInput(s)
    },
  }
}