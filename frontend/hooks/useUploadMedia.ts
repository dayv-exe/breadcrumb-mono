import { PresignedMediaItem, validPresignedMediaItemFile } from "@/api/getPresignedUrl";
import { MediaData } from "@/constants/media";
import { useGetPresignedUrl } from "@/hooks/queries/useGetPresignedUrl";
import { useMediaStore } from "@/utils/mediaStore";
import { File } from "expo-file-system";
import { useRef } from "react";

function deleteUploadedFilesLocally(processedMedia: MediaData[]) {
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

  if (typeof status === 'number') {
    if (status === 408 || status === 429) return true;
    return status >= 500 && status < 600;
  }

  // no status usually means a network error
  return true;
}

interface options {
  maxRetries?: number
  baseDelayMs?: number
  maxDelayMs?: number
}

export function useUploadMedia({
  baseDelayMs = 1_000,
  maxRetries = 3,
  maxDelayMs = 15_000
}: options) {
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

  const { mutateAsync: getPresignedUrl, } = useGetPresignedUrl();

  const updateUploadState = useMediaStore(s => s.updateUploadState)
  const attemptsRef = useRef<Map<string, number>>(new Map())
  const partUploadedRef = useRef<Set<string>>(new Set())

  const scheduleRetry = (media: MediaData, attempt: number, noncompositeId?: string) => {
    const delay =
      Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1)) +
      Math.random() * 250;

    updateUploadState(media.id, {
      ...media.uploadState,
      status: 'pending',
    })

    setTimeout(() => {
      upload(media, noncompositeId)
    }, delay)
  }

  const upload = async (media: MediaData, nonCompositeId?: string): Promise<PresignedMediaItem> => {
    const attempts = attemptsRef.current
    const partUploaded = partUploadedRef.current

    const attempt = attempts.get(media.id) ?? 0
    attempts.set(media.id, attempt + 1)

    const presignedUrlResponse = await getPresignedUrl({
      files: [media],
      crumbNonCompositeId: nonCompositeId ?? ""
    })

    const validFiles = presignedUrlResponse.validFiles;
    if (!validFiles.length) {
      const err = new Error("No valid files to upload!")
      updateUploadState(media.id, {
        ...media.uploadState,
        status: 'failed',
        error: err
      })
      throw err
    }

    const validFile = validFiles[0]

    updateUploadState(media.id, {
      ...media.uploadState,
      status: "uploading",
      error: null
    })

    try {
      if (!partUploaded.has(media.localUri)) {
        // only upload this part if it has not already been uploaded
        await uploadFile(validFile.media)
        updateUploadState(media.id, {
          ...media.uploadState,
          storageKey: validFile.media.mediaKey
        })
        partUploaded.add(media.localUri)
      }

      if (validFile.thumbnail) {
        // only upload this part if it has a thumbnail
        if (!partUploaded.has(media.thumbnailUri!)) {
          // only upload this part if it has not already been uploaded
          await uploadFile(validFile.thumbnail)
          updateUploadState(media.id, {
            ...media.uploadState,
            thumbnailStorageKey: validFile.media.mediaKey
          })
          partUploaded.add(media.thumbnailUri!)
        }
      }
    } catch (error) {
      if (attempt < maxRetries && isRetryable(error)) {
        scheduleRetry(media, attempt, nonCompositeId)
      } else {
        updateUploadState(media.id, {
          ...media.uploadState,
          status: 'failed',
          error: error instanceof Error ? error : new Error(String(error))
        })

        throw error
      }
    }

    updateUploadState(media.id, {
      ...media.uploadState,
      status: 'complete',
      error: null
    })
    deleteUploadedFilesLocally([media])
    return validFile
  };

  return { upload };
}