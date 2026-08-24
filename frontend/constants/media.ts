
export type MediaType = "photo" | "video" | "audio" | "text" | "profilePhoto" | null;

export type UploadState = {
  uploadUrl: string
  error: Error | null
  pending: boolean
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
