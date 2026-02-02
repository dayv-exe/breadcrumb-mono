import { MAX_PREVIEW_MEDIA } from "@/constants/appConstants";
import { MediaData } from "@/constants/media";
import { create } from "zustand";

export type Friend = {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean
};

type MediaState = {
  mediaPreview: MediaData[];
  showMediaPreviews: boolean
  isRecording: boolean;
  currentMediaIndex: number
  selectedFriend: Friend | null;
  setSelectedFriend: (f: Friend | null) => void;
  setCurrentMediaIndex: (i: number) => void;
  setShowMediaPreviews: (s: boolean) => void;
  addMediaPreview: (media: MediaData) => void;
  discardMediaPreview: () => void;
  discardAllMediaPreview: () => void;
  setIsRecording: (s: boolean) => void;
};

export const useMediaStore = create<MediaState>((set) => ({
  mediaPreview: [],
  isRecording: false,
  showMediaPreviews: false,
  currentMediaIndex: 0,
  selectedFriend: null,
  setSelectedFriend: (friend) => {
    set({ selectedFriend: friend })
  },
  setCurrentMediaIndex: (index) => {
    set({ currentMediaIndex: index })
  },
  addMediaPreview: (media) =>
    set((state) => {
      if (state.mediaPreview.length >= MAX_PREVIEW_MEDIA) {
        return { mediaPreview: [...state.mediaPreview] };
      }
      return { mediaPreview: [...state.mediaPreview, media] };
    }),
  discardMediaPreview: () =>
    set((state) => {
      const nextPreview = state.mediaPreview.filter(
        (_, i) => i !== state.currentMediaIndex
      );

      // Clamp index so it always stays in range
      const nextIndex = Math.min(
        state.currentMediaIndex,
        Math.max(0, nextPreview.length - 1)
      );

      return {
        mediaPreview: nextPreview,
        currentMediaIndex: nextIndex,
        showMediaPreviews: nextPreview.length > 0,
      };
    }),
  discardAllMediaPreview: () => set({ mediaPreview: [], showMediaPreviews: false }),
  setIsRecording: (isRec) => set({ isRecording: isRec }),
  setShowMediaPreviews: (show) => set(state => {
    return { currentMediaIndex: state.mediaPreview.length - 1, showMediaPreviews: show }
  }),
}));
