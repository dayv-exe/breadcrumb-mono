import { MediaData, UploadState } from '@/constants/media';
import { create } from 'zustand';

interface UploadQueueState {
  queue: MediaData[];

  add: (item: MediaData) => void;
  addMany: (items: MediaData[]) => void;
  remove: (id: string) => void;
  clear: () => void;

  next: () => MediaData | undefined;
  updateUploadState: (id: string, patch: UploadState) => void;
  getUploadState: (id: string) => UploadState | undefined
}

export const useUploadQueue = create<UploadQueueState>((set, get) => ({
  queue: [],

  add: (item) => {
    item.uploadState = {
      error: null,
      status: "pending",
    }
    set((state) => ({ queue: [...state.queue, item] }))
  },

  addMany: (items) => {
    const created = items.map(item => {
      item.uploadState = {
        error: null,
        status: "pending",
      }

      return item
    })
    set((state) => ({ queue: [...state.queue, ...created] }));
  },

  remove: (id) =>
    set((state) => ({ queue: state.queue.filter((i) => i.id !== id) })),

  updateUploadState: (id, patch) =>
    set((state) => ({
      queue: state.queue.map((i) => (i.id === id ? { ...i, uploadState: patch } : i)),
    })),

  clear: () => set({ queue: [] }),

  next: () => get().queue.find((i) => i.uploadState.status === "pending"),

  getUploadState: (id) => get().queue.find(m => m.id === id)?.uploadState,
}));