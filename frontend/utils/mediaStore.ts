import {
  MediaData,
  UploadState
} from "@/constants/media";
import { create } from "zustand";


export type EditingMode = "none" | "crop" | "text" | "sticker";

type MediaState = {
  media: MediaData[];
  isRecording: boolean;
  noncompositeCrumbId: string

  setIsRecording: (isRecording: boolean) => void;

  add: (item: MediaData) => void;
  addMany: (items: MediaData[]) => void
  remove: (id: string) => void;
  updateUploadState: (id: string, state: UploadState) => void;
  updateMediaCaption: (id: string, text: string) => void;
  clear: () => void;
  next: () => MediaData | undefined;
};

const initialState = {
  media: [],
  isRecording: false,
  noncompositeCrumbId: ""
};

export const useMediaStore = create<MediaState>((set, get) => {
  return {
    ...initialState,

    noncompositeCrumbId: "",

    setIsRecording: (isRecording) => set({ isRecording }),

    add: (item) => {
      item.uploadState = {
        error: null,
        status: "pending",

      }
      set((state) => ({ media: [...state.media, item] }))
    },

    addMany: (items) => {
      const created = items.map(item => {
        item.uploadState = {
          error: null,
          status: "pending",
        }

        return item
      })
      set((state) => ({ media: [...state.media, ...created] }));
    },

    remove: (id) =>
      set((state) => ({ media: state.media.filter((i) => i.id !== id) })),

    updateUploadState: (id, patch) =>
      set((state) => ({
        media: state.media.map((i) => (i.id === id ? { ...i, uploadState: patch } : i)),
      })),

    updateMediaCaption: (id, text) => {
      set(state => ({
        media: state.media.map(m => (m.id === id ? { ...m, caption: text } : m))
      }))
    },

    clear: () => set(initialState),

    next: () => get().media.find((i) => i.uploadState.status === "pending"),
  }
})