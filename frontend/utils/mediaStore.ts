import { MAX_PREVIEW_MEDIA } from "@/constants/appConstants";
import {
  MediaData
} from "@/constants/media";
import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";


export type EditingMode = "none" | "crop" | "text" | "sticker";

type MediaState = {
  mediaPreview: MediaData[];
  isRecording: boolean;
  noncompositeCrumbId: string

  reset: () => void;
  setIsRecording: (isRecording: boolean) => void;

  addMediaPreview: (media: MediaData) => string;
  discardMediaPreview: (id: string) => void;
  discardAllMediaPreview: () => void;

  updateMediaCaption: (id: string, text: string) => void;
};

const initialState = {
  mediaPreview: [],
  isRecording: false,

};

export const useMediaStore = create<MediaState>((set, get) => {
  const findMediaById = (id: string): number => {
    return get().mediaPreview.findIndex(media => media.id === id)
  }
  const updateMedia = (
    index: number,
    state: MediaState,
    updater: (media: MediaData) => MediaData
  ): Partial<MediaState> | MediaState => {
    const currentMedia = state.mediaPreview[index];
    if (!currentMedia) {
      return state;
    }

    const nextMediaPreview = [...state.mediaPreview];
    nextMediaPreview[index] = updater(currentMedia);

    return {
      mediaPreview: nextMediaPreview,
    };
  };

  return {
    ...initialState,

    noncompositeCrumbId: "",

    reset: () => set(initialState),

    setIsRecording: (isRecording) => set({ isRecording }),

    addMediaPreview: (media) => {
      const state = get();
      let nonCompId = state.noncompositeCrumbId

      if (state.noncompositeCrumbId.length < 1 || state.mediaPreview.length < 1) {
        nonCompId = uuidv4()
      }

      if (state.mediaPreview.length >= MAX_PREVIEW_MEDIA) {
        return "";
      }

      set({
        mediaPreview: [...state.mediaPreview, media],
        noncompositeCrumbId: nonCompId,
      });

      return media.id;
    },

    discardMediaPreview: (id) => {
      const index = findMediaById(id);
      if (index < 0) return;

      set({ mediaPreview: get().mediaPreview.filter((_, i) => i !== index) });
    },

    discardAllMediaPreview: () => set(initialState),

    updateMediaCaption: (id, text) => {
      const index = findMediaById(id)
      if (index < 0) return

      set((state) =>
        updateMedia(index, state, (media) => ({
          ...media,
          caption: text,
        }))
      )
    }
  }
})