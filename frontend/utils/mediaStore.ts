import { MAX_PREVIEW_MEDIA } from "@/constants/appConstants";
import { MediaData } from "@/constants/media";
import { create } from "zustand";

type MediaState = {
  mediaPreview: MediaData[];
  isRecording: boolean;
  addMediaPreview: (media: MediaData) => void;
  discardMediaPreview: (index: number) => void;
  discardAllMediaPreview: () => void;
  setIsRecording: (s: boolean) => void;
};

export const useMediaStore = create<MediaState>((set) => ({
  mediaPreview: [],
  isRecording: false,
  addMediaPreview: (media) =>
    set((state) => {
      if (state.mediaPreview.length >= MAX_PREVIEW_MEDIA) {
        return { mediaPreview: [...state.mediaPreview] };
      }
      return { mediaPreview: [...state.mediaPreview, media] };
    }),
  discardMediaPreview: (index) =>
    set((state) => ({
      mediaPreview: state.mediaPreview.filter((_, i) => i !== index),
    })),
  discardAllMediaPreview: () => set({ mediaPreview: [] }),
  setIsRecording: (isRec) => set({ isRecording: isRec }),
}));
