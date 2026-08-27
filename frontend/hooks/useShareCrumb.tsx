import { LocationSelectionManner } from "@/api/models/locationTypes"
import { useModal } from "@/components/modals/ModalContext"
import { DEFAULT_CRUMB_RADIUS, ShowToast } from "@/constants/appConstants"
import { useMediaStore } from "@/utils/mediaStore"
import { useLocationStore } from "@/utils/useLocationStore"
import { useEffect, useState } from "react"
import { useShareCrumbApi } from "./queries/useCrumbsApi"
import { useReverseGeocode } from "./useReverseGeocode"
import { useThemeColor } from "./useThemeColor"

export interface iRecipient {
  id: string,
  name: string
}

type ShareCrumbType = {
  recipients: iRecipient[]
  setRecipients: (rs: iRecipient[]) => void
  isPending: boolean
  handleShare: () => void
  address: string | null
}

export function useShareCrumb(
  processMedia: () => void,
): ShareCrumbType {
  const textCol = useThemeColor({}, "text")
  const { showModal, hideModal } = useModal()
  const [recipients, setRecipients] = useState<iRecipient[]>([])
  const [isPending, setIsPending] = useState(false)
  const resetMediaStore = useMediaStore(s => s.reset)
  const crumbMedia = useMediaStore(s => s.mediaPreview)
  const coordinates = useLocationStore(s => s.coordinates)
  const { address, setReverseGeocodeCoordinates } = useReverseGeocode()

  useEffect(() => {
    setReverseGeocodeCoordinates(coordinates)
  }, [coordinates, setReverseGeocodeCoordinates])

  const { mutateAsync: shareCrumb } = useShareCrumbApi()

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
    if (recipients.length === 0) return
    const poiId = undefined
    const crumbCoordinates = coordinates
    let crumbRadius: number = coordinates?.accuracy ?? DEFAULT_CRUMB_RADIUS
    let crumbLocationSelManner: LocationSelectionManner = "gps"

    if (!crumbCoordinates) {
      throw new Error("Crumb does not have a valid coordinate!")
    }

    shareCrumb({
      nonCompositeId: files[0].crumbId,
      latitude: crumbCoordinates.latitude,
      longitude: crumbCoordinates.longitude,
      clickedFeatureId: poiId,
      caption: files.map(f => ({
        index: f.index,
        content: f.text?.content ?? ""
      })),
      mediaItems: files.map(f => ({
        index: f.index,
        media: f.media?.mediaKey,
        type: f.type,
        thumbnail: f.thumbnail?.mediaKey,
      })),
      radius: crumbRadius,
      locationSelectionManner: crumbLocationSelManner,
      receivers: recipients.map(r => r.id),
      address: address ?? undefined
    }, {
      onSuccess: () => {
        setIsPending(false)
        hideModal()
        resetMediaStore()
        ShowToast("✅ Done")
      },
      onError: err => {
        setIsPending(false)
        handleNotifyErr(err)
      }
    })
  };

  return {
    recipients,
    setRecipients,
    isPending,
    handleShare,
    address,
  }
}