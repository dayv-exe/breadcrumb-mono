
export type MediaType = "photo" | "video" | "profilePhoto" | null;

export type UploadState = {
  status: "pending" | "uploading" | "failed" | "complete"
  error: Error | null
  storageKey?: string
  thumbnailStorageKey?: string
}

export function defaultMediaDataUploadState(): UploadState {
  return {
    error: null,
    status: "pending",
  }
}

// --- Media Data ---
export type MediaData = {
  id: string
  localUri: string
  thumbnailUri?: string
  uploadState: UploadState
  type: MediaType;
  duration?: number;
  width?: number;
  height?: number;
  fileName?: string;
  fileSize?: number;
  resizeMode: "cover" | "contain";
  caption?: string
  isPlaceholder?: boolean
};
