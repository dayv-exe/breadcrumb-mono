import { createVideoPlayer } from "expo-video";

export async function generateVideoThumbnail(uri: string) {
  const player = createVideoPlayer({ uri });

  try {
    const thumbnails = await player.generateThumbnailsAsync([0.7]); // seconds
    return thumbnails[0];
  } catch (error) {
    console.error("Thumbnail generation failed:", error);
    return undefined;
  } finally {
    player.release();
  }
}