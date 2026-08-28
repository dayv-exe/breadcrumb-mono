import { PresignedMediaItem, validPresignedMediaItemFile } from "@/api/getPresignedUrl";
import { MediaData } from "@/constants/media";
import { useGetPresignedUrl } from "@/hooks/queries/useGetPresignedUrl";
import { File } from "expo-file-system";

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

export function useManualUpload() {
  const { mutateAsync: getPresignedUrl, } = useGetPresignedUrl();
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

  const upload = async (processedMedia: MediaData[], nonCompositeId?: string): Promise<PresignedMediaItem[]> => {
    const presignedUrlResponse = await getPresignedUrl({
      files: processedMedia,
      crumbNonCompositeId: nonCompositeId ?? ""
    })

    const validFiles = presignedUrlResponse.validFiles;
    if (!validFiles.length) {
      throw new Error("No valid files to upload!")
    }

    const uploads: validPresignedMediaItemFile[] = [];

    validFiles.forEach((file) => {
      if (file.media.uploadUrl) uploads.push(file.media);
      if (file.thumbnail?.uploadUrl) uploads.push(file.thumbnail);
    });
    
    await Promise.all(uploads.map(uploadFile));
    deleteUploadedFilesLocally(processedMedia)
    
    return validFiles
  };

  return { upload };
}