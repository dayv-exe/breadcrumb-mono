import { useMediaStore } from "@/utils/mediaStore"

type UseUploadStoreState = {
  activeCount: number
  pendingCount: number
  errorCount: number
  failed: boolean
  pending: boolean
  success: boolean
}

export function useUploadStore(): UseUploadStoreState {
  const queue = useMediaStore(s => s.media)
  const activeCount = queue.filter(i => i.uploadState.status === "uploading").length
  const pendingCount = queue.filter(i => i.uploadState.status === "pending").length
  const errorCount = queue.filter(i => i.uploadState.status === "failed").length

  return {
    activeCount,
    pendingCount,
    errorCount,
    failed: errorCount > 0,
    pending: activeCount > 0 || pendingCount > 0,
    success: activeCount === 0 && pendingCount === 0 && errorCount === 0
  }
}