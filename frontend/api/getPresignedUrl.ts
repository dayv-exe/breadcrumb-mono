import axiosInstance from "@/constants/axios";
import { MediaType } from "@/constants/media";
import { AxiosError } from "axios";
import { apiResponse } from "./models/apiResponse";

export type MediaItem = {
  index: number
  media: string
  overlay?: string
  thumbnail?: string
  type: MediaType
}

export type PresignedMediaItem = {
  index: number
  crumbId: string
  media: validPresignedMediaItemFile
  overlay: validPresignedMediaItemFile | null
  thumbnail: validPresignedMediaItemFile | null
  type: MediaType
}

export type validPresignedMediaItemFile = {
  fileName: string;
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
    const axiosError = error as AxiosError<{ message: string }>;
    const backendMessage = axiosError.response?.data?.message
      ?? axiosError.message; // fallback to generic Axios message
    return { message: null, error: backendMessage };

  }
};