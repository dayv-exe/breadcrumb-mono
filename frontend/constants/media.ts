
export type MediaType = "photo" | "video" | "audio" | "text" | "profilePhoto" | null;

type UploadState = {
  uploadUrl: string
  error: Error | null
  pending: boolean
}

// --- Media Data ---
export type MediaData = {
  id: string
  uri: string; // raw
  media?: string // processed
  overlay?: string // processed
  thumbnail?: string; // processed
  type: MediaType;
  duration?: number;
  width?: number;
  height?: number;
  fileName?: string;
  fileSize?: number;
  resizeMode: "cover" | "contain";
  caption?: string
  isPlaceholder?: boolean
  uploadState: UploadState
};
