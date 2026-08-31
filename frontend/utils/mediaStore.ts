import {
  MediaData,
  UploadState
} from "@/constants/media";
import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";

export type EditingMode = "none" | "crop" | "text" | "sticker";

type MediaState = {
  media: MediaData[];
  isRecording: boolean;
  noncompositeCrumbId: string

  setIsRecording: (isRecording: boolean) => void;

  add: (item: MediaData) => void;
  updateMediaCaption: (id: string, text: string) => void;
  remove: (id: string) => void;
  clear: () => void;

  next: () => MediaData | undefined;
  updateUploadState: (id: string, patch: UploadState) => void;
  getUploadState: (id: string) => UploadState | undefined
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
      let newId = get().noncompositeCrumbId
      if (get().media.length === 0 || newId === "") {
        newId = uuidv4()
      }
      item.uploadState = {
        error: null,
        status: "pending",

      }
      set((state) => ({ media: [...state.media, item], noncompositeCrumbId: newId }))
    },

    remove: (id) => {
      let newId = get().noncompositeCrumbId
      if (get().media.length === 1) {
        newId = ""
      }
      set((state) => ({ media: state.media.filter((i) => i.id !== id), noncompositeCrumbId: newId }))
    },

    updateMediaCaption: (id, text) => {
      set(state => ({
        media: state.media.map(m => (m.id === id ? { ...m, caption: text } : m))
      }))
    },

    clear: () => set(initialState),

    next: () => get().media.find((i) => i.uploadState.status === "pending"),

    getUploadState: (id) => get().media.find(m => m.id === id)?.uploadState,
    updateUploadState: (id, patch) =>
      set((state) => ({
        media: state.media.map((i) => (i.id === id ? { ...i, uploadState: patch } : i)),
      })),
  }
})