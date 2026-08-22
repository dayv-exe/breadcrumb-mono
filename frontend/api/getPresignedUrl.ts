import axiosInstance from "@/constants/axios";
import { MediaData, MediaType } from "@/constants/media";
import { CrumbCaption } from "./models/crumb";

export type PresignRequest = {
  nonCompositeId: string
  files: MediaData[]
}

export type PresignedMediaItem = {
  index: number
  crumbId: string
  media: validPresignedMediaItemFile | null
  thumbnail: validPresignedMediaItemFile | null
  text: CrumbCaption | null
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
  presignRequest: PresignRequest
): Promise<presignedUrlResponse | null> => {
  const endpoint = presignRequest.files[0].type === "profilePhoto" ? "/media-access?action=presign&profilePicture=true" : "/media-access?action=presign"
  const { data } = await axiosInstance.post<{ message: presignedUrlResponse }>(
    endpoint,
    presignRequest
  );

  return data.message
};