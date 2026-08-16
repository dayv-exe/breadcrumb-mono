import { LocationSelectionManner } from "@/api/models/locationTypes"
import CustomLabel from "@/components/CustomLabel"
import { useModal } from "@/components/modals/ModalContext"
import Spacer from "@/components/Spacer"
import { DEFAULT_CRUMB_RADIUS, ShowToast } from "@/constants/appConstants"
import { useMediaStore } from "@/utils/mediaStore"
import { useLocationStore } from "@/utils/useLocationStore"
import { useEffect, useState } from "react"
import { ActivityIndicator, View } from "react-native"
import { useShareCrumbApi } from "./queries/useCrumbsApi"
import { useMediaUpload } from "./useMediaUpload"
import { useReverseGeocode } from "./useReverseGeocode"
import { useThemeColor } from "./useThemeColor"

enum LOCATION_OPTIONS {
  gps = "My location",
  custom = "Choose on map",
  global = "Global"
}

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
  }, [coordinates])

  const { upload } = useMediaUpload({
    onSuccess: files => {
      const poiId = undefined
      const crumbCoordinates = coordinates
      let crumbRadius: number = coordinates?.accuracy ?? DEFAULT_CRUMB_RADIUS
      let crumbLocationSelManner: LocationSelectionManner = "gps"

      if (!crumbCoordinates) {
        throw new Error("Crumb does not have a valid coordinate!")
      }

      shareCrumb({
        id: files[0].crumbId,
        latitude: crumbCoordinates.latitude,
        longitude: crumbCoordinates.longitude,
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
    },
    onError: (err) => {
      setIsPending(false)
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
    if (recipients.length === 0) return
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
    recipients,
    setRecipients,
    isPending,
    handleShare,
    address,
  }
}