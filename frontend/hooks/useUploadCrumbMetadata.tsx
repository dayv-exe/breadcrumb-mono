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

  useEffect(() => {
    setReverseGeocodeCoordinates(coordinates)
  }, [coordinates, setReverseGeocodeCoordinates])

  const { mutateAsync: uploadMetadata } = useUploadCrumbMetadataApi()

  const upload = async () => {
    if (recipients.length === 0) {
      throw new Error("Crumbs must have at least one recipient")
    }
  };

  return {
    recipients,
    setRecipients,
    upload,
    address,
  }
}