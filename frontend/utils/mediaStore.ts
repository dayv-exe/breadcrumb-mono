import { MAX_PREVIEW_MEDIA } from "@/constants/appConstants";
import { createDefaultTextOverlay, EditOverlay, MediaData } from "@/constants/media";
import { create } from "zustand";

export type Friend = {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean
};

// current overlay item and save transform
// current overlay item save value

type MediaState = {
  mediaPreview: MediaData[];
  showMediaPreviews: boolean
  isRecording: boolean;
  currentMediaIndex: number
  selectedFriend: Friend | null;
  editing: boolean
  setEditing: (s: boolean) => void
  setSelectedFriend: (f: Friend | null) => void;
  setCurrentMediaIndex: (i: number) => void;
  setShowMediaPreviews: (s: boolean) => void;
  addMediaPreview: (media: MediaData) => void;
  discardMediaPreview: () => void;
  discardAllMediaPreview: () => void;
  setIsRecording: (s: boolean) => void;
  addTextOverlayToCurrentMedia: (s: string, x: number, y: number) => void;
  removeTextOverlayFromCurrentMedia: (overlayId: string) => void;
  updateCurrentMediaOverlay: (overlayId: string, overlay: EditOverlay) => void
};

export const useMediaStore = create<MediaState>((set) => ({
  mediaPreview: [],
  isRecording: false,
  showMediaPreviews: false,
  currentMediaIndex: 0,
  selectedFriend: null,
  editing: false,

  setEditing: (s) => {
    set({ editing: s })
  },

  setSelectedFriend: (friend) => {
    set({ selectedFriend: friend })
  },
  setCurrentMediaIndex: (index) => {
    console.log("set index")
    set({ currentMediaIndex: index })
  },
  addMediaPreview: (media) =>
    set((state) => {
      console.log("add preview")
      if (state.mediaPreview.length >= MAX_PREVIEW_MEDIA) {
        return { mediaPreview: [...state.mediaPreview] };
      }
      return { mediaPreview: [...state.mediaPreview, { ...media, overlays: media.overlays ?? [] }] };
    }),
  discardMediaPreview: () =>
    set((state) => {
      console.log("discard preview")
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
    return { currentMediaIndex: state.mediaPreview.length - 1, showMediaPreviews: show, editing: false }
  }),
  addTextOverlayToCurrentMedia: (defaultText, x, y) =>
    set((state) => {
      console.log("add overlay")
      const index = state.currentMediaIndex;
      const media = state.mediaPreview[index];

      if (!media) return state;

      const nextMediaPreview = [...state.mediaPreview];
      nextMediaPreview[index] = {
        ...media,
        overlays: [...media.overlays ?? [], createDefaultTextOverlay(defaultText, x, y)],
      };

      return { mediaPreview: nextMediaPreview };
    }),
  removeTextOverlayFromCurrentMedia: (overlayId) =>
    set((state) => {
      console.log("remove overlay")
      const mediaIndex = state.currentMediaIndex;
      const media = state.mediaPreview[mediaIndex];

      if (!media || !media.overlays) return state;

      const nextMediaPreview = [...state.mediaPreview];

      nextMediaPreview[mediaIndex] = {
        ...media,
        overlays: media.overlays.filter(
          (overlay) =>
            !(overlay.type === "text" && overlay.id === overlayId)
        ),
      };

      return { mediaPreview: nextMediaPreview };
    }),
  updateCurrentMediaOverlay: (overlayId, overlay) =>
    set((state) => {
      console.log("update overlay")
      const mediaIndex = state.currentMediaIndex;
      const media = state.mediaPreview[mediaIndex];
      if (!media?.overlays) return state;

      const overlayIndex = media.overlays.findIndex((o) => o.id === overlayId);
      if (overlayIndex === -1) return state;

      const nextOverlays = [...media.overlays];
      nextOverlays[overlayIndex] = overlay; // ✅ replace whole object

      const nextMediaPreview = [...state.mediaPreview];
      nextMediaPreview[mediaIndex] = {
        ...media,
        overlays: nextOverlays, // ✅ rewrite entire overlays property
      };

      return { mediaPreview: nextMediaPreview };
    }),
}));