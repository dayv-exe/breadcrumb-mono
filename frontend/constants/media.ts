export type MediaType = "photo" | "video" | null;

export type MediaData = {
  uri: string;
  type: MediaType;
  duration?: number;
  thumbnail?: string;
  width?: number;
  height?: number;
  fileName?: string;
  fileSize?: number;
};
