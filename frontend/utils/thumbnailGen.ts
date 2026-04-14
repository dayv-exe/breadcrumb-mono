import { Image, createVideoThumbnail } from 'react-native-compressor';

type MediaType = 'image' | 'video';

export const generateThumbnail = async (
  uri: string,
  type: MediaType
): Promise<string> => {
  try {
    if (type === 'image') {
      // Resize image → thumbnail
      const thumbnail = await Image.compress(uri, {
        compressionMethod: 'manual',
        maxWidth: 200,
        maxHeight: 200,
        quality: 0.6,
      });

      return thumbnail;
    }

    if (type === 'video') {
      const { path } = await createVideoThumbnail(uri);
      return path;
    }

    throw new Error('Unsupported media type');
  } catch (error) {
    console.error('Thumbnail generation failed:', error);
    throw error;
  }
};