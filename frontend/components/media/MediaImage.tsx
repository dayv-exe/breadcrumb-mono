import { useMediaAccess } from "@/hooks/queries/useMediaAccessApi";
import React from "react";
import {
  ActivityIndicator,
  Image,
  ImageStyle,
  StyleProp,
  View,
} from "react-native";

type MediaImageProps = {
  mediaKey: string;
  style?: StyleProp<ImageStyle>;
  resizeMode?: "cover" | "contain" | "stretch" | "center";
  fallback?: React.ReactNode;
};

export const MediaImage: React.FC<MediaImageProps> = ({
  mediaKey,
  style,
  resizeMode = "cover",
  fallback,
}) => {
  const { data, isLoading, isError } = useMediaAccess(mediaKey);

  if (isLoading) {
    return (
      <View style={[{ justifyContent: "center", alignItems: "center" }, style]}>
        <ActivityIndicator />
      </View>
    );
  }

  if (isError || data?.error || !data?.message?.url) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <Image
      source={{ uri: data.message.url }}
      style={[{
        aspectRatio: 9/16
      }, style]}
      resizeMode={resizeMode}
    />
  );
};