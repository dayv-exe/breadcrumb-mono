import { useMediaStore } from "@/utils/mediaStore"
import { useEffect, useState } from "react"
import { useConcurrentMediaUpload } from "./useConcurrentMediaUpload"
import { iRecipient, useUploadCrumbMetadata } from "./useUploadCrumbMetadata"

interface ShareCrumbOptions {
  onError: (error: unknown) => void
  onSuccess: () => void
}

interface ShareCrumbState {
  share: () => void
  recipients: iRecipient[]
  setRecipients: (rs: iRecipient[]) => void
  address: string | null
  isPending: boolean
}

export function useShareCrumb({ onError, onSuccess }: ShareCrumbOptions): ShareCrumbState {
  const media = useMediaStore(s => s.media)
  const hasUploaded = media.filter(m => m.uploadState.status !== "complete").length === 0
  const { begin: restartConcurrentUpload } = useConcurrentMediaUpload({
    baseRetryDelayMs: 1000,
    maxRetryDelayMs: 5000,
    maxRetries: 2,
    concurrency: 3,
  })
  const {
    upload: uploadCrumbMetadata,
    address,
    recipients,
    setRecipients,
  } = useUploadCrumbMetadata()

  const [isPending, setIsPending] = useState(false)
  const [allowMetadataUpload, setAllowMetadataUpload] = useState(false)

  onError = (err) => {
    setIsPending(false)
    onError(err)
  }

  onSuccess = () => {
    setIsPending(false)
    onSuccess()
  }

  useEffect(() => {
    const push = async () => {
      await uploadCrumbMetadata()
    }
    if (allowMetadataUpload && hasUploaded) {
      try {
        push()
        onSuccess()
      } catch (error) {
        onError(error)
      }
    }
  }, [allowMetadataUpload, hasUploaded])

  const share = async () => {
    setIsPending(true)
    try {
      // if (failedUploads.length > 0) {
      //   await restartConcurrentUpload()
      // }

      setAllowMetadataUpload(true)
    } catch (e) {
      onError(e)
    }
  }

  return {
    share,
    address,
    recipients,
    setRecipients,
    isPending,
  }
}