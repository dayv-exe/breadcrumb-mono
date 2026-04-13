import { useMediaAccess } from "@/hooks/queries/useMediaAccessApi";
import { useAudioPlayer } from "expo-audio";
import { VideoView, useVideoPlayer } from "expo-video";
import React from "react";
import {
  ActivityIndicator,
  Image,
  ImageStyle,
  StyleProp,
  View,
  ViewStyle,
} from "react-native";

type MediaType = "image" | "video" | "audio";

type MediaViewProps = {
  mediaKey: string;
  style?: StyleProp<ViewStyle & ImageStyle>;
  resizeMode?: "cover" | "contain" | "stretch" | "center";
  fallback?: React.ReactNode;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
};

const MEDIA_EXTENSIONS: Record<MediaType, string[]> = {
  image: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"],
  video: [".mp4", ".mov", ".avi", ".mkv", ".webm"],
  audio: [".mp3", ".wav", ".aac", ".ogg", ".m4a", ".flac"],
};

const inferMediaType = (url: string): MediaType => {
  const path = url.split("?")[0].toLowerCase();
  for (const [type, extensions] of Object.entries(MEDIA_EXTENSIONS)) {
    if (extensions.some((ext) => path.endsWith(ext))) {
      return type as MediaType;
    }
  }
  return "image";
};

const VideoMedia: React.FC<{
  url: string;
  style?: StyleProp<ViewStyle>;
  autoPlay: boolean;
  loop: boolean;
  muted: boolean;
}> = ({ url, style, autoPlay, loop, muted }) => {
  const player = useVideoPlayer(url, (p) => {
    p.loop = loop;
    p.muted = muted;
    if (autoPlay) p.play();
  });

  return (
    <VideoView
      player={player}
      style={style}
    />
  );
};

const AudioMedia: React.FC<{
  url: string;
  autoPlay: boolean;
}> = ({ url, autoPlay }) => {
  const player = useAudioPlayer(url);

  React.useEffect(() => {
    if (autoPlay && player) {
      player.play();
    }
  }, [autoPlay, player]);

  return null; // Audio-only — pair with your own custom UI controls
};

export const MediaView: React.FC<MediaViewProps> = ({
  mediaKey,
  style,
  resizeMode = "cover",
  fallback,
  autoPlay = false,
  loop = false,
  muted = false,
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

  const { url } = data.message;
  const mediaType = inferMediaType(url);

  switch (mediaType) {
    case "video":
      return (
        <VideoMedia
          url={url}
          style={style}
          autoPlay={autoPlay}
          loop={loop}
          muted={muted}
        />
      );

    case "audio":
      return (
        <AudioMedia
          url={url}
          autoPlay={autoPlay}
        />
      );

    case "image":
    default:
      return (
        <Image
          source={{ uri: url }}
          style={[style]}
          resizeMode={resizeMode}
        />
      );
  }
};