import CrumbsUploadingIndicator from "@/components/crumbs/CrumbsUploadingIndicator"
import { useModal } from "@/components/modals/ModalContext"
import { useMediaStore } from "@/utils/mediaStore"
import { useCallback, useEffect, useRef, useState } from "react"
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

function ShareProgress() {
  const totalCount = useMediaStore(s => s.media.length)
  const uploadedCount = useMediaStore(
    s => s.media.filter(m => m.uploadState.status === "complete").length
  )
  return <CrumbsUploadingIndicator totalCount={totalCount} uploadedCount={uploadedCount} />
}

export function useShareCrumb({ onError, onSuccess }: ShareCrumbOptions): ShareCrumbState {
  const media = useMediaStore(s => s.media)
  const clearMedia = useMediaStore(s => s.clear)
  const mediaUploadComplete = media.every(m => m.uploadState.status === "complete")
  const mediaUploadFailed = media.some(m => m.uploadState.status === "failed")

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

  const { hideModal, showModal } = useModal()

  const [isPending, setIsPending] = useState(false)
  const [waitingForMedia, setWaitingForMedia] = useState(false)

  const sharingRef = useRef(false)
  const metadataStartedRef = useRef(false)
  const awaitingRetryRef = useRef(false)

  const latest = useRef({ onError, onSuccess, uploadCrumbMetadata, hideModal, clearMedia })
  useEffect(() => {
    latest.current = { onError, onSuccess, uploadCrumbMetadata, hideModal, clearMedia }
  })

  const reset = useCallback(() => {
    sharingRef.current = false
    metadataStartedRef.current = false
    awaitingRetryRef.current = false
    setWaitingForMedia(false)
    setIsPending(false)
    latest.current.hideModal()
  }, [])

  const finishWithError = useCallback((err: unknown) => {
    reset()
    latest.current.onError(err)
  }, [reset])

  const finishWithSuccess = useCallback(() => {
    reset()
    latest.current.clearMedia()
    latest.current.onSuccess()
  }, [reset])

  useEffect(() => {
    if (!waitingForMedia || metadataStartedRef.current) return

    if (mediaUploadFailed) {
      if (awaitingRetryRef.current) return // restart hasn't reset the failed items yet
      finishWithError("Something went wrong, try again.")
      return
    }

    // Failed items have been picked up again; any later failure is real
    awaitingRetryRef.current = false

    if (!mediaUploadComplete) return

    metadataStartedRef.current = true
    setWaitingForMedia(false)
    latest.current.uploadCrumbMetadata().then(finishWithSuccess, finishWithError)
  }, [waitingForMedia, mediaUploadComplete, mediaUploadFailed, finishWithError, finishWithSuccess])

  const share = () => {
    if (sharingRef.current) return
    sharingRef.current = true

    if (mediaUploadFailed) {
      awaitingRetryRef.current = true
      restartConcurrentUpload()
    }

    setIsPending(true)
    setWaitingForMedia(true)
    showModal({ content: <ShareProgress /> })
  }

  return {
    share,
    address,
    recipients,
    setRecipients,
    isPending,
  }
}