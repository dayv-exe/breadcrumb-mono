import { getCrumbMarkers } from "@/api/crumbsApi"
import { CrumbMarkerDetails } from "@/api/models/CrumbMarkerDetails"
import { useEffect, useMemo, useState } from "react"

type UseMarkersType = {
  markers: Map<string, CrumbMarkerDetails>
  isLoading: boolean
  error: unknown
}

type FetchResult = {
  key: string
  markers: CrumbMarkerDetails[]
  error: unknown
}

export const useCrumbMarkers = (senderIds: string[]): UseMarkersType => {
  const key = [...senderIds].sort().join(",")
  const [result, setResult] = useState<FetchResult | null>(null)

  useEffect(() => {
    if (!key) return

    let cancelled = false
    const ids = key.split(",")

    getCrumbMarkers(ids)
      .then(markers => {
        if (!cancelled) setResult({ key, markers, error: null })
      })
      .catch(error => {
        if (!cancelled) setResult({ key, markers: [], error })
      })

    return () => {
      cancelled = true
    }
  }, [key])

  const isCurrent = !!key && result?.key === key

  const markersMap = useMemo(
    () => isCurrent
      ? new Map(result.markers.map(m => [m.userid, m]))
      : new Map,
    [isCurrent, result]
  )

  return {
    markers: markersMap,
    isLoading: !!key && !isCurrent,
    error: isCurrent ? result.error : null,
  }
}