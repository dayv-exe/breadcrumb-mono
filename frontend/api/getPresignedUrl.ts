import axiosInstance from "@/constants/axios";
import { MediaData, MediaType } from "@/constants/media";
import { crumbText } from "./models/crumbText";

export type PresignedMediaItem = {
  index: number
  crumbId: string
  media: validPresignedMediaItemFile | null
  overlay: validPresignedMediaItemFile | null
  thumbnail: validPresignedMediaItemFile | null
  text: crumbText | null
  type: MediaType
}

export type validPresignedMediaItemFile = {
  fileName: string;
  type: MediaType
  contentType: string;
  mediaKey: string;
  uploadUrl: string;
  fields: Record<string, string>
};

export type invalidPresignedFile = {
  fileName: string;
  reason: string;
};

export type presignedUrlResponse = {
  crumbId: string
  validFiles: PresignedMediaItem[];
  invalidFiles: invalidPresignedFile[];
};

export const getPresignedUrls = async (
  files: MediaData[]
): Promise<presignedUrlResponse | null> => {
  const endpoint = files[0].type === "profilePhoto" ? "/media-access?action=presign&profilePicture=true" : "/media-access?action=presign"
  const { data } = await axiosInstance.post<{ message: presignedUrlResponse }>(
    endpoint,
    { files }
  );

  return data.message
};