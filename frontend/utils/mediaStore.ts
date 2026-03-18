import { MAX_PREVIEW_MEDIA } from "@/constants/appConstants";
import {
  createDefaultCropTransform,
  createDefaultStickerOverlay,
  createDefaultTextOverlay,
  EditOverlay,
  MediaData,
} from "@/constants/media";
import { create } from "zustand";

export type Friend = {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
};

export type EditingMode = "none" | "crop" | "text" | "sticker";

type MediaState = {
  mediaPreview: MediaData[];
  showMediaPreviews: boolean;
  isRecording: boolean;
  currentMediaIndex: number;
  selectedFriend: Friend | null;
  editing: EditingMode;
  sharing: boolean;

  reset: () => void;

  setSharing: (sharing: boolean) => void;
  setEditing: (editing: EditingMode) => void;
  setSelectedFriend: (friend: Friend | null) => void;
  setCurrentMediaIndex: (index: number) => void;
  setShowMediaPreviews: (show: boolean) => void;
  setIsRecording: (isRecording: boolean) => void;

  addMediaPreview: (media: MediaData) => number;
  replaceMediaPreview: (index: number, media: MediaData) => void;
  discardMediaPreview: () => void;
  discardAllMediaPreview: () => void;

  addTextOverlayToCurrentMedia: (text: string, x: number, y: number) => void;
  addStickerOverlayToCurrentMedia: (sticker: string, x: number, y: number) => void;
  removeOverlayFromCurrentMedia: (overlayId: string) => void;
  updateCurrentMediaOverlay: (overlayId: string, overlay: EditOverlay) => void;
  updateCurrentMediaText: (text: string) => void;

  goToPreviousPreview: () => void;
  goToNextPreview: () => void;

  applyCurrentMediaCrop: () => void;
  revertCurrentMediaCrop: () => void;
};

const normalizeMedia = (media: MediaData): MediaData => ({
  ...media,
  overlays: media.overlays ?? [],
});

const clampIndex = (index: number, length: number): number => {
  if (length <= 0) return 0;
  return Math.min(Math.max(0, index), length - 1);
};

const updateCurrentMedia = (
  state: MediaState,
  updater: (media: MediaData) => MediaData
): Partial<MediaState> | MediaState => {
  const index = clampIndex(state.currentMediaIndex, state.mediaPreview.length);
  const currentMedia = state.mediaPreview[index];

  if (!currentMedia) {
    return state;
  }

  const nextMediaPreview = [...state.mediaPreview];
  nextMediaPreview[index] = updater(currentMedia);

  return {
    mediaPreview: nextMediaPreview,
    currentMediaIndex: index,
  };
};

const initialState = {
  mediaPreview: [],
  showMediaPreviews: false,
  isRecording: false,
  currentMediaIndex: 0,
  selectedFriend: null,
  editing: "none" as EditingMode,
  sharing: false,
};

export const useMediaStore = create<MediaState>((set, get) => ({
  ...initialState,

  reset: () => set(initialState),


  setSharing: (sharing) => set({ sharing }),

  setEditing: (editing) => set({ editing }),

  setSelectedFriend: (friend) => set({ selectedFriend: friend }),

  setCurrentMediaIndex: (index) =>
    set((state) => ({
      currentMediaIndex: clampIndex(index, state.mediaPreview.length),
    })),

  setShowMediaPreviews: (show) =>
    set((state) => {
      const hasMedia = state.mediaPreview.length > 0;

      return {
        showMediaPreviews: show && hasMedia,
        currentMediaIndex: hasMedia
          ? clampIndex(state.currentMediaIndex, state.mediaPreview.length)
          : 0,
        editing: "none",
      };
    }),

  setIsRecording: (isRecording) => set({ isRecording }),

  addMediaPreview: (media) => {
    const state = get();

    if (state.mediaPreview.length >= MAX_PREVIEW_MEDIA) {
      return -1;
    }

    const newIndex = state.mediaPreview.length;
    const nextMedia = normalizeMedia(media);

    set({
      mediaPreview: [...state.mediaPreview, nextMedia],
      currentMediaIndex: newIndex,
    });

    return newIndex;
  },

  replaceMediaPreview: (index, media) =>
    set((state) => {
      if (index < 0 || index >= state.mediaPreview.length) {
        return state;
      }

      const nextMediaPreview = [...state.mediaPreview];
      nextMediaPreview[index] = normalizeMedia(media);

      return {
        mediaPreview: nextMediaPreview,
        currentMediaIndex: clampIndex(state.currentMediaIndex, nextMediaPreview.length),
      };
    }),

  discardMediaPreview: () =>
    set((state) => {
      if (state.mediaPreview.length === 0) {
        return state;
      }

      const nextMediaPreview = state.mediaPreview.filter(
        (_, index) => index !== state.currentMediaIndex
      );

      const hasMedia = nextMediaPreview.length > 0;

      return {
        mediaPreview: nextMediaPreview,
        currentMediaIndex: hasMedia
          ? clampIndex(state.currentMediaIndex, nextMediaPreview.length)
          : 0,
        showMediaPreviews: hasMedia,
        editing: "none",
      };
    }),

  discardAllMediaPreview: () => set(initialState),

  addTextOverlayToCurrentMedia: (text, x, y) =>
    set((state) =>
      updateCurrentMedia(state, (media) => ({
        ...media,
        overlays: [
          ...(media.overlays ?? []),
          createDefaultTextOverlay(text, x, y),
        ],
      }))
    ),

  addStickerOverlayToCurrentMedia: (sticker, x, y) =>
    set((state) =>
      updateCurrentMedia(state, (media) => ({
        ...media,
        overlays: [
          ...(media.overlays ?? []),
          createDefaultStickerOverlay(sticker, x, y),
        ],
      }))
    ),

  removeOverlayFromCurrentMedia: (overlayId) =>
    set((state) =>
      updateCurrentMedia(state, (media) => ({
        ...media,
        overlays: (media.overlays ?? []).filter((overlay) => overlay.id !== overlayId),
      }))
    ),

  updateCurrentMediaOverlay: (overlayId, overlay) =>
    set((state) =>
      updateCurrentMedia(state, (media) => {
        const overlays = media.overlays ?? [];
        const overlayIndex = overlays.findIndex((item) => item.id === overlayId);

        if (overlayIndex === -1) {
          return media;
        }

        const nextOverlays = [...overlays];
        nextOverlays[overlayIndex] = overlay;

        return {
          ...media,
          overlays: nextOverlays,
        };
      })
    ),

  updateCurrentMediaText: (text) =>
    set((state) =>
      updateCurrentMedia(state, (media) => ({
        ...media,
        text,
      }))
    ),

  goToPreviousPreview: () =>
    set((state) => {
      const length = state.mediaPreview.length;
      if (length === 0) return state;

      return {
        currentMediaIndex:
          state.currentMediaIndex <= 0
            ? length - 1
            : state.currentMediaIndex - 1,
      };
    }),

  goToNextPreview: () =>
    set((state) => {
      const length = state.mediaPreview.length;
      if (length === 0) return state;

      return {
        currentMediaIndex:
          state.currentMediaIndex >= length - 1
            ? 0
            : state.currentMediaIndex + 1,
      };
    }),

  applyCurrentMediaCrop: () =>
    set((state) => {
      const index = clampIndex(state.currentMediaIndex, state.mediaPreview.length);
      const media = state.mediaPreview[index];

      if (!media || media.type !== "photo") {
        return state;
      }

      if (!media.pendingCropTransform) {
        return { editing: "none" };
      }

      const nextMediaPreview = [...state.mediaPreview];
      nextMediaPreview[index] = {
        ...media,
        cropTransform: media.pendingCropTransform,
        pendingCropTransform: undefined,
      };

      return {
        mediaPreview: nextMediaPreview,
        currentMediaIndex: index,
        editing: "none",
      };
    }),

  revertCurrentMediaCrop: () =>
    set((state) => {
      const index = clampIndex(state.currentMediaIndex, state.mediaPreview.length);
      const media = state.mediaPreview[index];

      if (!media || media.type !== "photo") {
        return state;
      }

      const nextMediaPreview = [...state.mediaPreview];
      nextMediaPreview[index] = {
        ...media,
        cropTransform: createDefaultCropTransform(),
        pendingCropTransform: undefined,
      };

      return {
        mediaPreview: nextMediaPreview,
        currentMediaIndex: index,
        editing: "none",
      };
    }),
}));