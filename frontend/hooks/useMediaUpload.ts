import { PresignedMediaItem, validPresignedMediaItemFile } from "@/api/getPresignedUrl";
import { MediaData } from "@/constants/media";
import { useGetPresignedUrl } from "@/hooks/queries/useGetPresignedUrl";
import { File } from "expo-file-system";

interface UseMediaUploadOptions {
  isProfilePicture?: boolean
  onSuccess?: (files: PresignedMediaItem[]) => void;
  onError?: (error: unknown) => void;
}

function deleteUploadedFilesLocally(processedMedia: MediaData[]) {
  for (const med of processedMedia) {
    for (const path of [med.uri, med.media, med.thumbnail]) {
      if (!path) continue;
      try {
        const f = new File(path);
        if (f.exists) f.delete();
      } catch (e) {
        console.warn("cleanup failed", path, e);
      }
    }
  }
}

export function useMediaUpload(options?: UseMediaUploadOptions) {
  const { mutate: presignedUrl } = useGetPresignedUrl();
  const handleSuccess = (validFiles: PresignedMediaItem[]) => {
    options?.onSuccess?.(validFiles)
  }

  const handleError = (error: unknown) => {
    options?.onError?.(error)
  }

  const uploadFile = async (file: validPresignedMediaItemFile) => {
    const formData = new FormData();

    // Append all policy fields first
    for (const [key, value] of Object.entries(file.fields)) {
      formData.append(key, value);
    }

    formData.append("file", {
      uri: file.fileName,
      type: file.contentType,
      name: file.mediaKey,
    } as any);

    const response = await fetch(file.uploadUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log("Upload failed:", {
        mediaKey: file.mediaKey,
        status: response.status,
        body: errorText,
      });
      throw new Error(`Upload failed for ${file.mediaKey}`);
    }

  };

  const upload = async (processedMedia: MediaData[], nonCompositeId?: string) => {
    presignedUrl({
      nonCompositeId: nonCompositeId ?? "",
      files: processedMedia
    }, {
      onSuccess: async (s) => {
        const validFiles = s?.validFiles;
        if (!validFiles?.length) {
          options?.onError?.("No valid files to upload!")
          return;
        }

        const uploads: validPresignedMediaItemFile[] = [];

        validFiles.forEach((file) => {
          if (file.media?.uploadUrl) uploads.push(file.media);
          if (file.thumbnail?.uploadUrl) uploads.push(file.thumbnail);
        });

        try {
          await Promise.all(uploads.map(uploadFile));
          deleteUploadedFilesLocally(processedMedia)
          handleSuccess(validFiles)
        } catch (err) {
          console.log("Upload error:", err);
          handleError(err)
        }
      },
      onError: (e) => {
        console.log("Presigned URL error:", e);
        options?.onError?.(e);
      },
    });
  };

  return { upload };
}