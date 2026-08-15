import { useBigActivityIndicator } from "@/components/modals/BigActivityIndicatorContext";
import { useModal } from "@/components/modals/ModalContext";
import { MAX_PREVIEW_MEDIA, MAX_VIDEO_DURATION_MILLISECONDS, MEDIA_FULL_MESSAGE } from "@/constants/appConstants";
import { MediaData } from "@/constants/media";
import { useMediaStore } from "@/utils/mediaStore";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Alert, Platform, ScaledSize, useWindowDimensions } from "react-native";
import { v4 as uuidv4 } from "uuid";
import { useShallow } from "zustand/shallow";
import { useMediaPermissions } from "./usePermissions";

interface ImagePickerOptions {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
  mediaTypes?: ImagePicker.MediaType[];
  allowMultipleSel?: boolean
  selectionLimit?: number
  onPictureChosen?: (image: MediaData) => void;
}

interface UseImagePickerReturn {
  image: MediaData | null;
  isLoading: boolean;
  pickFromGallery: (options?: ImagePickerOptions, addToMediaPreview?: boolean) => Promise<void>;
  takePhoto: (options?: ImagePickerOptions) => Promise<void>;
  clearImage: () => void;
}

const DEFAULT_OPTIONS: ImagePickerOptions = {
  allowsEditing: true,
  quality: 1,
  mediaTypes: ["images"],
  allowMultipleSel: false,
  selectionLimit: 5,
};

function getImageResizeMode(imageWidth: number, imageHeight: number, screenDimensions: ScaledSize): "cover" | "contain" {
  const imageAspect = imageWidth / imageHeight;
  const screenAspect = screenDimensions.width / screenDimensions.height;
  const aspectDiff = Math.abs(imageAspect - screenAspect);
  return aspectDiff < 0.125 ? "cover" : "contain"
}

export const useImagePicker = (): UseImagePickerReturn => {
  const [image, setImage] = useState<MediaData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { addMediaPreview, mediaPreviews } = useMediaStore(useShallow(
    s => ({
      addMediaPreview: s.addMediaPreview,
      mediaPreviews: s.mediaPreview,
    })
  ));
  const screenDimensions = useWindowDimensions();
  const { requestImagePickerCamera, requestImagePickerGallery } = useMediaPermissions()
  const { showModal, hideModal } = useModal()
  const { hideActivity, showActivity } = useBigActivityIndicator()

  const processImageResult = (
    result: ImagePicker.ImagePickerResult,
  ): MediaData[] | null => {
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets;
      let processed: MediaData[] = []
      asset.map(asset => {
        if (asset.duration && asset.duration > MAX_VIDEO_DURATION_MILLISECONDS + 1000) {
          showModal({
            message: `Oops! That video is a little too long. Videos can be up to ${(MAX_VIDEO_DURATION_MILLISECONDS) / 1000} seconds.`,
            primaryBtnText: "Okay",
            onPrimary: hideModal
          })

          return
        }
        processed.push({
          index: 0,
          uploadState: { error: null, pending: false, uploadUrl: "" },
          id: uuidv4(),
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          type:
            asset.type === "image" || asset.type === "livePhoto"
              ? "photo"
              : "video",
          fileName: asset.fileName ?? "",
          fileSize: asset.fileSize,
          resizeMode: getImageResizeMode(asset.width, asset.height, screenDimensions)
        })
      })
      return processed
    }
    return null;
  };

  const pickFromGallery = async (
    options?: ImagePickerOptions,
    addToMediaPreview: boolean = true,
  ): Promise<void> => {
    if (mediaPreviews.length >= MAX_PREVIEW_MEDIA) {
      showModal({
        message: MEDIA_FULL_MESSAGE,
        showCancelBtn: false,
        primaryBtnText: "Okay",
        onPrimary: () => {
          hideModal()
        }
      })

      return
    }
    setIsLoading(true);
    try {
      const hasPermission = await requestImagePickerGallery();
      if (!hasPermission) {
        setIsLoading(false);
        return;
      }

      const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
      showActivity({
        message: "Importing selected media"
      })
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mergedOptions.mediaTypes,
        allowsEditing: mergedOptions.allowsEditing,
        aspect: mergedOptions.aspect,
        quality: 1,
        allowsMultipleSelection: mergedOptions.allowMultipleSel,
        videoExportPreset: ImagePicker.VideoExportPreset.MediumQuality,
        ...(Platform.OS === "ios"
          ? { shouldDownloadFromNetwork: true }
          : {}),
        selectionLimit: mergedOptions.selectionLimit,
      })

      const processedImage = processImageResult(result);
      if (processedImage) {
        options?.onPictureChosen?.(processedImage[processedImage.length - 1])
        if (addToMediaPreview) {
          processedImage.map(m => {
            addMediaPreview(m);
          })
        }
      }

      hideActivity()
    } catch (error) {
      console.error("Error picking image from gallery:", error);
      Alert.alert("Error", "Failed to pick image from gallery");
    } finally {
      setIsLoading(false);
    }
  };

  const takePhoto = async (options?: ImagePickerOptions, onImageSelected?: (image: MediaData) => void): Promise<void> => {
    setIsLoading(true);
    try {
      const hasPermission = await requestImagePickerCamera();
      if (!hasPermission) {
        setIsLoading(false);
        return;
      }

      const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: mergedOptions.mediaTypes,
        allowsEditing: mergedOptions.allowsEditing,
        aspect: mergedOptions.aspect,
        quality: 1,
      });

      const processedImage = processImageResult(result);
      if (processedImage) {
        options?.onPictureChosen?.(processedImage[processedImage.length - 1])
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo");
    } finally {
      setIsLoading(false);
    }
  };

  const clearImage = () => {
    setImage(null);
  };

  return {
    image,
    isLoading,
    pickFromGallery,
    takePhoto,
    clearImage,
  };
};
