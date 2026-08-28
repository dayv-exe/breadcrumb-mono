import { crumbBody } from "@/api/crumbsApi"
import { useMediaStore } from "@/utils/mediaStore"
import { useLocationStore } from "@/utils/useLocationStore"
import { useEffect, useState } from "react"
import { useUploadCrumbMetadataApi } from "./queries/useCrumbsApi"
import { useReverseGeocode } from "./useReverseGeocode"

export interface iRecipient {
  id: string,
  name: string
}

type UploadCrumbMetadataState = {
  recipients: iRecipient[]
  setRecipients: (rs: iRecipient[]) => void
  upload: () => void
  address: string | null
}

export function useUploadCrumbMetadata(): UploadCrumbMetadataState {
  const [recipients, setRecipients] = useState<iRecipient[]>([])
  const coordinates = useLocationStore(s => s.coordinates)
  const { address, setReverseGeocodeCoordinates } = useReverseGeocode()
  const media = useMediaStore(s => s.media)
  const nonCompId = useMediaStore(s => s.noncompositeCrumbId)
  const failedUploads = useMediaStore(s => s.getFailedUploads)

  useEffect(() => {
    setReverseGeocodeCoordinates(coordinates)
  }, [coordinates, setReverseGeocodeCoordinates])

  const { mutateAsync: uploadMetadata } = useUploadCrumbMetadataApi()

  const upload = async () => {

    if (recipients.length === 0) {
      throw new Error("Crumbs must have at least one recipient!")
    } else if (failedUploads.length > 0) {
      throw new Error("Upload crumb media first before metadata!")
    } else if (!coordinates || !coordinates.accuracy) {
      throw new Error("Crumbs must have latitude, longitude and radius!")
    }

    const crumb: crumbBody = {
      nonCompositeId: nonCompId,
      mediaItems: media.map((m, index) => (
        {
          index: index,
          type: m.type,
          caption: m.caption,
          media: m.uploadState.storageKey!,
          thumbnail: m.uploadState.thumbnailStorageKey,
        }
      )),
      receivers: recipients.map(r => r.id),
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      radius: coordinates.accuracy,
      locationSelectionManner: "gps",
      address: address ?? "",
    }

    await uploadMetadata(crumb)

  };

  return {
    recipients,
    setRecipients,
    upload,
    address,
  }
}