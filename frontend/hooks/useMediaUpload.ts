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
    for (const path of [med.uri, med.media, med.overlay, med.thumbnail]) {
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

  const upload = async (processedMedia: MediaData[]) => {
    presignedUrl(processedMedia, {
      onSuccess: async (s) => {
        try {
          s?.invalidFiles.map(f => {
            console.log("Name: " + f.fileName + "\n" + "Reason: " + f.reason)
          })
          const validFiles = s?.validFiles;
          if (!validFiles?.length) {
            options?.onError?.("No valid files to upload!")
            return;
          }

          const uploads: validPresignedMediaItemFile[] = [];

          validFiles.forEach((file) => {
            if (file.media?.uploadUrl) uploads.push(file.media);
            if (file.overlay?.uploadUrl) uploads.push(file.overlay);
            if (file.thumbnail?.uploadUrl) uploads.push(file.thumbnail);
          });

          await Promise.all(uploads.map(uploadFile));
          // delete all files from cache
          deleteUploadedFilesLocally(processedMedia)
          options?.onSuccess?.(validFiles);
        } catch (err) {
          console.log("Upload error:", err);
          options?.onError?.(err);
        } finally {
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