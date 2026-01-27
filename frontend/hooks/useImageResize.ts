import { useEffect, useState } from "react";
import { Image, useWindowDimensions } from "react-native";

// Add this hook to get image dimensions and determine resize mode
export function useImageResizeMode(uri: string): "cover" | "contain" {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [resizeMode, setResizeMode] = useState<"cover" | "contain">("contain");

  useEffect(() => {
    Image.getSize(
      uri,
      (imageWidth, imageHeight) => {
        const imageAspect = imageWidth / imageHeight;
        const screenAspect = screenWidth / screenHeight;
        const aspectDiff = Math.abs(imageAspect - screenAspect);
        setResizeMode(aspectDiff < 0.125 ? "cover" : "contain");
      },
      (error) => {
        console.warn("Failed to get image size:", error);
        setResizeMode("contain");
      }
    );
  }, [uri, screenWidth, screenHeight]);

  return resizeMode;
}