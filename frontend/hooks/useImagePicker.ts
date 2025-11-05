import { showSettingsAlert } from '@/utils/helpers';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert } from 'react-native';

interface ImagePickerOptions {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
  mediaTypes?: ImagePicker.MediaType[];
  onPictureChosen?: () => void
}

interface ImageResult {
  uri: string;
  width: number;
  height: number;
  type?: string;
  fileName?: string;
  fileSize?: number;
}

interface UseImagePickerReturn {
  image: ImageResult | null;
  isLoading: boolean;
  pickFromGallery: (options?: ImagePickerOptions) => Promise<void>;
  takePhoto: (options?: ImagePickerOptions) => Promise<void>;
  clearImage: () => void;
}

const DEFAULT_OPTIONS: ImagePickerOptions = {
  allowsEditing: true,
  quality: 0.8,
  mediaTypes: ['images'],
};

export const useImagePicker = (): UseImagePickerReturn => {
  const [image, setImage] = useState<ImageResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const requestPermission = async (type: 'camera' | 'gallery'): Promise<boolean> => {
    try {
      const permission = type === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        showSettingsAlert(
          type.toUpperCase()
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Permission error:', error);
      return false;
    }
  };

  const processImageResult = (result: ImagePicker.ImagePickerResult): ImageResult | null => {
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      return {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        type: asset.type,
        fileName: asset.fileName ?? "",
        fileSize: asset.fileSize,
      };
    }
    return null;
  };

  const pickFromGallery = async (options?: ImagePickerOptions): Promise<void> => {
    setIsLoading(true);
    try {
      const hasPermission = await requestPermission('gallery');
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
      }
    } catch (error) {
      console.error('Error picking image from gallery:', error);
      Alert.alert('Error', 'Failed to pick image from gallery');
    } finally {
      setIsLoading(false);
    }
  };

  const takePhoto = async (options?: ImagePickerOptions): Promise<void> => {
    setIsLoading(true);
    try {
      const hasPermission = await requestPermission('camera');
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
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
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