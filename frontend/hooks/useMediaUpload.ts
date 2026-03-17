import { MediaItem, validPresignedMediaItemFile } from "@/api/getPresignedUrl";
import { useGetPresignedUrl } from "@/hooks/queries/useGetPresignedUrl";

interface UseMediaUploadOptions {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
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

    console.log("Uploaded:", file.mediaKey);
  };

  const upload =
    async (processedMedia: MediaItem[]) => {
      presignedUrl(processedMedia, {
        onSuccess: async (s) => {
          try {
            const validFiles = s.message?.validFiles;
            if (!validFiles?.length) {
              return;
            }

            const uploads: validPresignedMediaItemFile[] = [];

            validFiles.forEach((file) => {
              uploads.push(file.media);
              if (file.overlay?.uploadUrl) uploads.push(file.overlay);
              if (file.thumbnail?.uploadUrl) uploads.push(file.thumbnail);
            });

            await Promise.all(uploads.map(uploadFile));

            options?.onSuccess?.();
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