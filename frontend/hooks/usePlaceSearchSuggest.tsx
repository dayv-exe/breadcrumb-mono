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
  const strokeWidth = 2.5
  const makiOpacity = .6
  const fillCol = "transparent"
  return (
    <TouchableOpacity style={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      width: "100%",
      paddingVertical: 10,
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
            <SchoolIcon strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={fillCol} opacity={makiOpacity} />
          ) : place.maki === "restaurant" ? (
            <UtensilsCrossedIcon strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={fillCol} opacity={makiOpacity} />
          ) : place.maki === "shop" ? (
            <ShoppingCartIcon strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={fillCol} opacity={makiOpacity} />
          ) : place.maki === "bus" ? (
            <BusFrontIcon strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={fillCol} opacity={makiOpacity} />
          ) : place.maki === "airport" ? (
            <PlaneTakeoffIcon strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={fillCol} opacity={makiOpacity} />
          ) : place.maki === "hospital" ? (
            <HeartPulseIcon strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={fillCol} opacity={makiOpacity} />
          ) : place.maki === "attraction" ? (
            <CameraIcon strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={fillCol} opacity={makiOpacity} />
          ) : place.maki === "fast-food" ? (
            <UtensilsCrossedIcon strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={fillCol} opacity={makiOpacity} />
          ) : place.maki === "taxi" ? (
            <CarTaxiFrontIcon strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={fillCol} opacity={makiOpacity} />
          ) : place.maki === "bar" ? (
            <BeerIcon strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={fillCol} opacity={makiOpacity} />
          ) : place.maki === "information" ? (
            <InfoIcon strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={fillCol} opacity={makiOpacity} />
          ) : place.maki === "jewelry-store" ? (
            <GemIcon strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={fillCol} opacity={makiOpacity} />
          ) : place.maki === "parking" ? (
            <ParkingCircleIcon strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={fillCol} opacity={makiOpacity} />
          ) : place.maki === "museum" ? (
            <LandmarkIcon strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={fillCol} opacity={makiOpacity} />
          ) : place.maki === "lodging" ? (
            <BedIcon strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={fillCol} opacity={makiOpacity} />
          ) : place.maki === "fitness-centre" ? (
            <SportShoeIcon strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={fillCol} opacity={makiOpacity} />
          ) : place.maki === "cinema" ? (
            <ClapperboardIcon strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={fillCol} opacity={makiOpacity} />
          ) : place.maki === "town-hall" ? (
            <LandmarkIcon strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={fillCol} opacity={makiOpacity} />
          ) : place.maki === "cafe" ? (
            <CoffeeIcon strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={fillCol} opacity={makiOpacity} />
          ) : place.maki === "natural" ? (
            <TreesIcon strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={fillCol} opacity={makiOpacity} />
          ) : place.maki === "bakery" ? (
            <CroissantIcon strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={fillCol} opacity={makiOpacity} />
          ) : place.maki === "building" ? (
            <BuildingIcon strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={fillCol} opacity={makiOpacity} />
          ) : place.maki === "campsite" ? (
            <TentIcon strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={fillCol} opacity={makiOpacity} />
          ) : (
            <MapPinIcon strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={fillCol} opacity={makiOpacity} />
          )
        }
      </View>
      < View style={{ flexGrow: 1, flexShrink: 1, }}>
        <CustomLabel labelText={place.name} adaptToTheme fontSize={15} bold customStyle={{
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

export const usePlaceSearchSuggest = (sessionToken: string, userlocation: Coordinates, mapCenter: Coordinates, OnPlaceSelect: (placeId: string) => void): UsePlaceSuggestionReturns => {
  const [searchStr, setSearchStr] = useState("")
  const [debouncedSearchStr, setDebouncedSearchStr] = useState("")

  const debounceInput = useMemo(() => {
    return debounce((value: string) => {
      setDebouncedSearchStr(value);
    }, 500);
  }, []);

  const { data: searchResponse, isError: searchFailed, isFetching: searchPending } = useSearchPlace(sessionToken, debouncedSearchStr, mapCenter, userlocation)

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