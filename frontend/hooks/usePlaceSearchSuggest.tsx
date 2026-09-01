import { Suggestion } from "@/api/models/placeSearch";
import { Section } from "@/components/views/ElevatedSectionedScrollView";
import SearchResult from "@/components/views/SearchResult";
import { debounce } from "@/utils/debounce";
import { Coordinates } from "@/utils/useLocationStore";
import React, { useMemo, useState } from "react";
import { useSearchPlace } from "./queries/usePlacesSearchApi";

type UsePlaceSuggestionReturns = {
  searchFailed: boolean
  searchPending: boolean
  section: Section
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

  const section: Section =
  {
    key: "places",
    hidden: (places?.length ?? 0) < 1,
    type: "paginated",
    title: "Places",
    data: places ?? [],
    hasMore: false,
    isFetchingMore: searchPending,
    keyExtractor: (place: Suggestion) => place.mapbox_id,
    renderItem: (place: Suggestion) => (
      <SearchResult data={{ type: "place", place }} onSelect={p => OnPlaceSelect(p)} />
    ),
    onEndReached: () => { }
  }

  return {
    searchFailed,
    searchPending,
    section,
    places,
    search: searchStr,
    setSearch: s => {
      setSearchStr(s)
      debounceInput(s)
    },
  }
}