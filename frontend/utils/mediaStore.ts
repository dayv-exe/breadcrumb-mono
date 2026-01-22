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
    set((state) => ({ mediaPreview: [...state.mediaPreview, media] })),
  discardMediaPreview: (index) =>
    set((state) => ({
      mediaPreview: state.mediaPreview.filter((_, i) => i !== index),
    })),
  discardAllMediaPreview: () => set({ mediaPreview: [] }),
  setIsRecording: (isRec) => set({ isRecording: isRec }),
}));
