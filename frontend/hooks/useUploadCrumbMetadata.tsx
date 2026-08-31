import { crumbBody } from "@/api/crumbsApi"
import { useMediaStore } from "@/utils/mediaStore"
import { useUploadQueue } from "@/utils/uploadQueue"
import { useLocationStore } from "@/utils/useLocationStore"
import { useEffect, useState } from "react"
import { useUploadCrumbMetadataApi } from "./queries/useCrumbsApi"
import { useReverseGeocode } from "./useReverseGeocode"
import { useUploadStore } from "./useUploadStore"

export interface iRecipient {
  id: string,
  name: string
}

type UploadCrumbMetadataState = {
  recipients: iRecipient[]
  setRecipients: (rs: iRecipient[]) => void
  upload: () => Promise<void>
  address: string | null
}

export function useUploadCrumbMetadata(): UploadCrumbMetadataState {
  const [recipients, setRecipients] = useState<iRecipient[]>([])
  const coordinates = useLocationStore(s => s.coordinates)
  const { address, setReverseGeocodeCoordinates } = useReverseGeocode()
  const nonCompId = useMediaStore(s => s.noncompositeCrumbId)
  const { failed: uploadFailed, success: uploadsSuccessful } = useUploadStore()
  const queue = useUploadQueue(s => s.queue)

  useEffect(() => {
    setReverseGeocodeCoordinates(coordinates)
  }, [coordinates, setReverseGeocodeCoordinates])

  const { mutateAsync: uploadMetadata } = useUploadCrumbMetadataApi()

  const upload = async () => {

    if (uploadsSuccessful) {
      if (recipients.length === 0) {
        throw new Error("Crumbs must have at least one recipient!")
      } else if (!coordinates || !coordinates.accuracy) {
        throw new Error("Crumbs must have latitude, longitude and radius!")
      }

      const crumb: crumbBody = {
        nonCompositeId: nonCompId,
        mediaItems: queue.map((m, index) => (
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
    } else {
      throw new Error("Crumb media uploads must complete successfully before metadata uploads!")
    }
  };

  return {
    recipients,
    setRecipients,
    upload,
    address,
  }
}