import { useAutoUploadQueue } from "./useAutoUploadQueue"

type UseUploadStoreState = {
  activeCount: number
  pendingCount: number
  retryingCount: number
  errorCount: number
  hasFailed: boolean
  isUploading: boolean
}

export function useAutoUploadStore(): UseUploadStoreState {
  const queue = useAutoUploadQueue(s => s.queue)
  const activeCount = queue.filter(i => i.uploadState.status === "uploading").length
  const pendingCount = queue.filter(i => i.uploadState.status === "pending").length
  const retryingCount = queue.filter(i => i.uploadState.status === "retrying").length
  const errorCount = queue.filter(i => i.uploadState.status === "failed").length
 
  return {
    activeCount,
    pendingCount,
    retryingCount,
    errorCount,
    hasFailed: errorCount > 0,
    isUploading: activeCount > 0 || retryingCount > 0 || pendingCount > 0,
  }
}