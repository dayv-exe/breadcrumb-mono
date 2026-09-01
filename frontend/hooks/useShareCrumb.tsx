import CrumbsUploadingIndicator from "@/components/crumbs/CrumbsUploadingIndicator"
import { useModal } from "@/components/modals/ModalContext"
import { useMediaStore } from "@/utils/mediaStore"
import { useEffect, useRef, useState } from "react"
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
  const mediaUploadComplete = media.every(m => m.uploadState.status === "complete")
  const mediaUploadFailed = media.some(m => m.uploadState.status === "failed")
  const mediaUploadedCount = media.filter(m => m.uploadState.status === "complete").length
  const clearMedia = useMediaStore(s => s.clear)

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
  const { hideModal, showModal } = useModal()

  const onErrorRef = useRef(onError)
  const onSuccessRef = useRef(onSuccess)
  useEffect(() => {
    onErrorRef.current = onError
    onSuccessRef.current = onSuccess
  })

  useEffect(() => {
    if (!allowMetadataUpload) return

    const finishWithError = (err: unknown) => {
      setAllowMetadataUpload(false)
      setIsPending(false)
      hideModal()
      onErrorRef.current(err)
    }

    const finishWithSuccess = () => {
      clearMedia()
      setAllowMetadataUpload(false)
      setIsPending(false)
      hideModal()
      onSuccessRef.current()
    }

    if (mediaUploadComplete) {
      showModal({
        content: (
          <CrumbsUploadingIndicator
            totalCount={media.length}
            uploadedCount={mediaUploadedCount}
          />
        ),
      })
      setAllowMetadataUpload(false)
      uploadCrumbMetadata()
        .then(finishWithSuccess)
        .catch(finishWithError)
    } else if (mediaUploadFailed) {
      finishWithError("Something went wrong, try again.")
    } else {
      showModal({
        content: (
          <CrumbsUploadingIndicator
            totalCount={media.length}
            uploadedCount={mediaUploadedCount}
          />
        ),
      })
    }
  }, [allowMetadataUpload, media.length, mediaUploadComplete, mediaUploadFailed, mediaUploadedCount])

  const share = () => {
    setIsPending(true)
    setAllowMetadataUpload(true)
  }

  return {
    share,
    address,
    recipients,
    setRecipients,
    isPending,
  }
}