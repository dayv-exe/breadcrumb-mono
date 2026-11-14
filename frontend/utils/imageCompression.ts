import { MAX_CRUMB_PHOTO_EDGE } from "@/constants/appConstants";
import { Image as ImageCompressor } from "react-native-compressor";

export async function compressImage(originalUri: string, quality = .85): Promise<string> {
  return await ImageCompressor.compress(originalUri, {
    compressionMethod: "manual",
    maxWidth: MAX_CRUMB_PHOTO_EDGE,
    maxHeight: MAX_CRUMB_PHOTO_EDGE,
    quality,
    output: "jpg",
  });
}