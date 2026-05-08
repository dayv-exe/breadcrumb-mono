import axiosInstance from "@/constants/axios";
import { MediaData, MediaType } from "@/constants/media";
import { apiResponse, extractBackendMsg } from "./models/apiResponse";
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