import { Suggestion } from "@/api/models/placeSearch";
import CustomLabel from "@/components/CustomLabel";
import { Section } from "@/components/views/ElevatedSectionedScrollView";
import { debounce } from "@/utils/debounce";
import { convertToPreferredDistance } from "@/utils/helpers";
import { Coordinates } from "@/utils/useLocationStore";
import { BedIcon, BeerIcon, BuildingIcon, BusFrontIcon, CameraIcon, CarTaxiFrontIcon, ClapperboardIcon, CoffeeIcon, CroissantIcon, GemIcon, HeartPulseIcon, InfoIcon, LandmarkIcon, MapPinIcon, ParkingCircleIcon, PlaneTakeoffIcon, SchoolIcon, ShoppingCartIcon, SportShoeIcon, TentIcon, TreesIcon, UtensilsCrossedIcon } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { useSearchPlace } from "./queries/usePlacesSearchApi";
import { useThemeColor } from "./useThemeColor";

const SearchResult = ({ place, onSelect }: { place: Suggestion, onSelect: (pId: string) => void }) => {
  const textCol = useThemeColor({}, "text")
  console.log(place.maki)
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
        {
          place.maki === "school" || place.maki === "college" ? (
            <SchoolIcon strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={textCol} opacity={.4} />
          ) : place.maki === "restaurant" ? (
            <UtensilsCrossedIcon strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={textCol} opacity={.4} />
          ) : place.maki === "shop" ? (
            <ShoppingCartIcon strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={textCol} opacity={.4} />
          ) : place.maki === "bus" ? (
            <BusFrontIcon strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={textCol} opacity={.4} />
          ) : place.maki === "airport" ? (
            <PlaneTakeoffIcon strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={textCol} opacity={.4} />
          ) : place.maki === "hospital" ? (
            <HeartPulseIcon strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={textCol} opacity={.4} />
          ) : place.maki === "attraction" ? (
            <CameraIcon strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={textCol} opacity={.4} />
          ) : place.maki === "fast-food" ? (
            <UtensilsCrossedIcon strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={textCol} opacity={.4} />
          ) : place.maki === "taxi" ? (
            <CarTaxiFrontIcon strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={textCol} opacity={.4} />
          ) : place.maki === "bar" ? (
            <BeerIcon strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={textCol} opacity={.4} />
          ) : place.maki === "information" ? (
            <InfoIcon strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={textCol} opacity={.4} />
          ) : place.maki === "jewelry-store" ? (
            <GemIcon strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={textCol} opacity={.4} />
          ) : place.maki === "parking" ? (
            <ParkingCircleIcon strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={textCol} opacity={.4} />
          ) : place.maki === "museum" ? (
            <LandmarkIcon strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={textCol} opacity={.4} />
          ) : place.maki === "lodging" ? (
            <BedIcon strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={textCol} opacity={.4} />
          ) : place.maki === "fitness-centre" ? (
            <SportShoeIcon strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={textCol} opacity={.4} />
          ) : place.maki === "cinema" ? (
            <ClapperboardIcon strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={textCol} opacity={.4} />
          ) : place.maki === "town-hall" ? (
            <LandmarkIcon strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={textCol} opacity={.4} />
          ) : place.maki === "cafe" ? (
            <CoffeeIcon strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={textCol} opacity={.4} />
          ) : place.maki === "natural" ? (
            <TreesIcon strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={textCol} opacity={.4} />
          ) : place.maki === "bakery" ? (
            <CroissantIcon strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={textCol} opacity={.4} />
          ) : place.maki === "building" ? (
            <BuildingIcon strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={textCol} opacity={.4} />
          ) : place.maki === "campsite" ? (
            <TentIcon strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={textCol} opacity={.4} />
          ) : (
            <MapPinIcon strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={textCol} opacity={.4} />
          )
        }
      </View>
      < View style={{ flexGrow: 1, flexShrink: 1, }}>
        <CustomLabel labelText={place.name} adaptToTheme bold fontSize={15} customStyle={{
          paddingVertical: 0,
        }} />
        <CustomLabel allowTruncate fade labelText={convertToPreferredDistance(place.distance ?? 0) + " • " + (place.full_address ?? place.place_formatted)} adaptToTheme fontSize={13} customStyle={{
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
      onEndReached: () => {  }
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