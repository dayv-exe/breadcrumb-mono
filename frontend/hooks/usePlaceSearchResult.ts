import { RetrieveResponse } from "@/api/models/placeSearch"
import { Coordinates } from "@/utils/useLocationStore"
import { useEffect, useState } from "react"
import { useRetrievePlace } from "./queries/usePlacesSearchApi"

type returnType = {
  sessionToken: string
  setSessionToken: (s: string) => void
  setPlaceId: (p: string) => void
  searchResult: RetrieveResponse | null
  clearSearchResult: () => void
}

export const usePlaceSearchResult = (userlocation: Coordinates | null,
  onPlaceFound: (coords: [number, number]) => void): returnType => {
  const [sessionToken, setSessionToken] = useState("")
  const [placeId, setPlaceId] = useState("")
  const { data: placeInfo, isError: retrieveFailed, isPending: retrievePending } = useRetrievePlace(sessionToken, placeId, userlocation ?? { accuracy: 0, latitude: 0, longitude: 0 })
  const [searchResult, setSearchResult] = useState<RetrieveResponse | null>(null)
  useEffect(() => {
    const place = placeInfo?.features[0]
    if (!place) return
    const coords = (place.geometry as any).coordinates as [number, number]
    setSearchResult(placeInfo)
    onPlaceFound(coords)
  }, [placeInfo, retrieveFailed, retrievePending])

  const clearSearchResult = () => setSearchResult(null)

  return {
    sessionToken,
    setSessionToken,
    setPlaceId,
    searchResult,
    clearSearchResult
  }
}