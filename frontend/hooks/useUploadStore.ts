import { useMediaStore } from "@/utils/mediaStore"

type UseUploadStoreState = {
  activeCount: number
  pendingCount: number
  retryingCount: number
  errorCount: number
  failed: boolean
  pending: boolean
  success: boolean
}

export function useUploadStore(): UseUploadStoreState {
  const media = useMediaStore(s => s.media)
  const activeCount = media.filter(i => i.uploadState.status === "uploading").length
  const pendingCount = media.filter(i => i.uploadState.status === "pending").length
  const retryingCount = media.filter(i => i.uploadState.status === "retrying").length
  const errorCount = media.filter(i => i.uploadState.status === "failed").length

  return {
    activeCount,
    pendingCount,
    retryingCount,
    errorCount,
    failed: errorCount > 0,
    pending: activeCount > 0 || retryingCount > 0 || pendingCount > 0,
    success: activeCount === 0 && pendingCount === 0 && retryingCount === 0 && errorCount === 0
  }
}