import { MediaData } from "@/constants/media";
import { showSettingsAlert } from "@/utils/helpers";
import { useMediaStore } from "@/utils/mediaStore";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Alert, ScaledSize, useWindowDimensions } from "react-native";

interface ImagePickerOptions {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
  mediaTypes?: ImagePicker.MediaType[];
  onPictureChosen?: () => void;
}

interface UseImagePickerReturn {
  image: MediaData | null;
  isLoading: boolean;
  pickFromGallery: (options?: ImagePickerOptions) => Promise<void>;
  takePhoto: (options?: ImagePickerOptions) => Promise<void>;
  clearImage: () => void;
}

const DEFAULT_OPTIONS: ImagePickerOptions = {
  allowsEditing: true,
  quality: 0.8,
  mediaTypes: ["images"],
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
  const { addMediaPreview } = useMediaStore();
  const screenDimensions = useWindowDimensions();

  const requestPermission = async (
    type: "camera" | "gallery",
  ): Promise<boolean> => {
    try {
      const permission =
        type === "camera"
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        showSettingsAlert(type.toUpperCase());
        return false;
      }
      return true;
    } catch (error) {
      console.error("Permission error:", error);
      return false;
    }
  };

  const processImageResult = (
    result: ImagePicker.ImagePickerResult,
  ): MediaData | null => {
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      return {
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
      };
    }
    return null;
  };

  const pickFromGallery = async (
    options?: ImagePickerOptions,
  ): Promise<void> => {
    setIsLoading(true);
    try {
      const hasPermission = await requestPermission("gallery");
      if (!hasPermission) {
        setIsLoading(false);
        return;
      }

      const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mergedOptions.mediaTypes,
        allowsEditing: mergedOptions.allowsEditing,
        aspect: mergedOptions.aspect,
        quality: mergedOptions.quality,
      });

      const processedImage = processImageResult(result);
      if (processedImage) {
        setImage(processedImage);
        addMediaPreview(processedImage);
      }
    } catch (error) {
      console.error("Error picking image from gallery:", error);
      Alert.alert("Error", "Failed to pick image from gallery");
    } finally {
      setIsLoading(false);
    }
  };

  const takePhoto = async (options?: ImagePickerOptions): Promise<void> => {
    setIsLoading(true);
    try {
      const hasPermission = await requestPermission("camera");
      if (!hasPermission) {
        setIsLoading(false);
        return;
      }

      const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: mergedOptions.mediaTypes,
        allowsEditing: mergedOptions.allowsEditing,
        aspect: mergedOptions.aspect,
        quality: mergedOptions.quality,
      });

      const processedImage = processImageResult(result);
      if (processedImage) {
        setImage(processedImage);
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
