import { SelectedLocation } from "@/api/models/locationTypes"
import CustomLabel from "@/components/CustomLabel"
import { useModal } from "@/components/modals/ModalContext"
import { LocationOptionsProps } from "@/components/share/LocationOption"
import Spacer from "@/components/Spacer"
import { DEFAULT_CRUMB_RADIUS, ShowToast } from "@/constants/appConstants"
import { useMediaStore } from "@/utils/mediaStore"
import { useLocationStore } from "@/utils/useLocationStore"
import { useEffect, useState } from "react"
import { ActivityIndicator, View } from "react-native"
import { useShareCrumbApi } from "./queries/useCrumbsApi"
import { useMediaUpload } from "./useMediaUpload"
import { useThemeColor } from "./useThemeColor"

enum LOCATION_OPTIONS {
  gps = "My location",
  custom = "Choose on map",
  global = "Global"
}

interface iRecipient {
  id: string,
  name: string
}

type ShareCrumbType = {
  selectedLocation: SelectedLocation | null
  setSelectedLocation: (l: SelectedLocation) => void
  locationOptions: LocationOptionsProps[]
  recipients: iRecipient[]
  setRecipients: (rs: iRecipient[]) => void
  isPending: boolean
  handleShare: () => void
  showMap: boolean
  setShowMap: (s: boolean) => void
  address: string | null
}

export function useShareCrumb(
  processMedia: () => void,
  usePlural?: boolean
): ShareCrumbType {
  const textCol = useThemeColor({}, "text")
  const { showModal, hideModal } = useModal()
  const [showMap, setShowMap] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null)
  const [recipients, setRecipients] = useState<iRecipient[]>([])
  const [locationSelManner, setLocationSelManner] = useState(LOCATION_OPTIONS.gps)
  const [isPending, setIsPending] = useState(false)
  const resetMediaStore = useMediaStore(s => s.reset)
  const crumbMedia = useMediaStore(s => s.mediaPreview)

  const reverseGeocode = useLocationStore(s => s.reverseGeocode)
  const [address, setAddress] = useState<string | null>(null)

  const locationKey = `${selectedLocation?.coordinates.latitude},${selectedLocation?.coordinates.longitude}`

  useEffect(() => {
    let cancelled = false

    if (!selectedLocation) {
      setAddress(null)
      return
    }

    reverseGeocode(selectedLocation.coordinates).then((result) => {
      if (!cancelled) setAddress(selectedLocation.type === "pin" ? `Near ${result}` : result)
    })

    return () => { cancelled = true }
  }, [locationKey])

  const locationOptions: LocationOptionsProps[] = [
    {
      iconEmoji: "📍",
      name: "Current location",
      selected: locationSelManner === LOCATION_OPTIONS.gps,
      selectedText: `Crumb${usePlural ? "s" : ""} can only be opened here`,
      onPressed: () => {
        setLocationSelManner(LOCATION_OPTIONS.gps)
        setSelectedLocation(null)
      }
    },
    {
      iconEmoji: "🗺️",
      name: "Choose on map",
      selectedName: selectedLocation?.type === "pin" ? `Pin (${address})` : selectedLocation?.poi.properties?.name,
      selected: locationSelManner === LOCATION_OPTIONS.custom,
      selectedText: `Crumb${usePlural ? "s" : ""} can only be opened there`,
      onPressed: () => {
        setLocationSelManner(LOCATION_OPTIONS.custom)
        setShowMap(true)
      }
    },
    // {
    //   iconEmoji: "🌍",
    //   name: "Global",
    //   selected: locationSelManner === LOCATION_OPTIONS.global,
    //   selectedText: `Crumb${usePlural ? "s" : ""} can be opened anywhere`,
    //   onPressed: () => {
    //     setLocationSelManner(LOCATION_OPTIONS.global)
    //     setSelectedLocation(null)
    //   }
    // },
  ]

  const { upload } = useMediaUpload({
    onSuccess: files => {
      if (!selectedLocation) return
      const poiId = selectedLocation.type === "poi" && selectedLocation.poi.id ? selectedLocation.poi.id.toString() : undefined
      shareCrumb({
        id: files[0].crumbId,
        lat: selectedLocation.coordinates.latitude,
        lon: selectedLocation.coordinates.longitude,
        clickedFeatureId: poiId,
        text: files.filter(f => f.type === "text").map(f => ({
          index: f.index,
          content: f.text?.content ?? ""
        })),
        mediaItems: files.filter(f => f.type !== "text").map(f => ({
          index: f.index,
          media: f.media?.mediaKey,
          type: f.type,
          overlay: f.overlay?.mediaKey,
          thumbnail: f.thumbnail?.mediaKey,
        })),
        locationAccuracy: selectedLocation.coordinates.accuracy ?? DEFAULT_CRUMB_RADIUS,
        locationType: locationSelManner === LOCATION_OPTIONS.gps ? "gps" : locationSelManner === LOCATION_OPTIONS.custom ? poiId ? "label" : "dropped-pin" : "none",
        receivers: recipients.map(r => r.id),
      }, {
        onSuccess: () => {
          setIsPending(false)
          hideModal()
          resetMediaStore()
          ShowToast("✅ Done")
        },
        onError: err => {
          handleNotifyErr(err)
        }
      })
    },
    onError: (err) => {
      handleNotifyErr(err)
    },
  });

  const { mutate: shareCrumb } = useShareCrumbApi()

  const handleNotifyErr = (err: any) => {
    console.log("Share failed:", err);
    setIsPending(false)
    showModal({
      message: "Something went wrong, try again.",
      primaryBtnText: "Ok",
      onPrimary: hideModal
    })
  }

  const handleShare = async () => {
    setIsPending(true)

    showModal({
      content: (
        <View style={{
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <CustomLabel bold adaptToTheme textAlign="center" labelText="Sharing, hang tight..." />
          <Spacer />
          < ActivityIndicator color={textCol} style={{
            width: 17,
            height: 17,
          }
          } />
          < Spacer />
        </View>
      )
    })
    await processMedia()
    upload(crumbMedia);
  };

  return {
    setSelectedLocation,
    selectedLocation,
    locationOptions,
    recipients,
    setRecipients,
    isPending,
    handleShare,
    showMap,
    setShowMap,
    address,
  }
}