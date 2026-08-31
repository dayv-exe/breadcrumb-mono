import { PresignedMediaItem, validPresignedMediaItemFile } from "@/api/getPresignedUrl";
import { MediaData } from "@/constants/media";
import { useGetPresignedUrl } from "@/hooks/queries/useGetPresignedUrl";
import { useMediaStore } from "@/utils/mediaStore";
import { File } from "expo-file-system";

export function deleteUploadedFilesLocally(processedMedia: MediaData[]) {
  for (const med of processedMedia) {
    for (const path of [med.localUri, med.thumbnailUri]) {
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

function isRetryable(error: unknown): boolean {
  const status =
    (error as { status?: number })?.status ??
    (error as { response?: { status?: number } })?.response?.status;

  if (typeof status === "number") {
    if (status === 408 || status === 429) return true;
    return status >= 500 && status < 600;
  }

  // no status means a network error
  return true;
}

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

interface Options {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

export function useUploadMedia({
  baseDelayMs = 1_000,
  maxRetries = 3,
  maxDelayMs = 15_000,
}: Options = {}) {
  const { mutateAsync: getPresignedUrl } = useGetPresignedUrl();
  const updateUploadState = useMediaStore((s) => s.updateUploadState);

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

  const backoffFor = (attempt: number) =>
    Math.min(maxDelayMs, baseDelayMs * 2 ** attempt) + Math.random() * 250;

  const upload = async (
    media: MediaData,
    nonCompositeId?: string
  ): Promise<PresignedMediaItem> => {

    const uploadedParts = new Set<string>();
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      updateUploadState(media.id, { status: "uploading", error: null });

      const presignedUrlResponse = await getPresignedUrl({
        files: [media],
        crumbNonCompositeId: nonCompositeId ?? "",
      });

      const validFiles = presignedUrlResponse.validFiles;
      if (!validFiles.length) {
        const err = new Error("No valid files to upload!");
        updateUploadState(media.id, { status: "failed", error: err });
        throw err;
      }

      const validFile = validFiles[0];

      const hasThumbnail = validFile.thumbnail && media.thumbnailUri
      const thumbnailStorageKey = validFile.thumbnail?.mediaKey ?? ""

      try {
        if (!uploadedParts.has(media.localUri)) {
          await uploadFile(validFile.media);
          uploadedParts.add(media.localUri);
        }

        if (hasThumbnail) {
          if (!uploadedParts.has(media.thumbnailUri!)) {
            await uploadFile(validFile.thumbnail!);
            uploadedParts.add(media.thumbnailUri!);
          }
        }

        updateUploadState(media.id, {
          status: "complete",
          error: null,
          thumbnailStorageKey: thumbnailStorageKey,
          storageKey: validFile.media.mediaKey
        });

        // deleteUploadedFilesLocally([media]);
        return validFile;
      } catch (error) {
        lastError = error;

        const canRetry = attempt < maxRetries && isRetryable(error);
        if (!canRetry) {
          updateUploadState(media.id, {
            status: "failed",
            error: error instanceof Error ? error : new Error(String(error)),
          });
          throw error;
        }

        // await the backoff so the retry stays on this promise chain and the
        await delay(backoffFor(attempt));
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error(String(lastError ?? "upload failed"));
  };

  return { upload };
}