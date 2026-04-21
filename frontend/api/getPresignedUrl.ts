import axiosInstance from "@/constants/axios";
import { MediaType } from "@/constants/media";
import { crumbText } from "./crumbsApi";
import { apiResponse, extractBackendMsg } from "./models/apiResponse";

export type MediaItem = {
  index: number
  media: string
  overlay?: string
  thumbnail?: string
  text?: crumbText
  type: MediaType
}

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
  files: MediaItem[]
): Promise<apiResponse<presignedUrlResponse | null>> => {
  const endpoint = files[0].type === "profilePhoto" ? "/api/v1/media-access?action=presign&profilePicture=true" : "/api/v1/media-access?action=presign"

  try {
    const { data } = await axiosInstance.post<{ message: presignedUrlResponse }>(
      endpoint,
      { files }
    );
    return { message: data.message, error: null };
  } catch (error) {

    return { message: null, error: extractBackendMsg(error) };

  }
};