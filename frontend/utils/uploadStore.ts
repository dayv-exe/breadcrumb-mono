import { MediaData } from '@/constants/media';
import { create } from 'zustand';

interface UploadQueueState {
  queue: MediaData[];

  add: (item: MediaData) => void;
  addMany: (items: MediaData[]) => void;
  remove: (id: string) => void;
  update: (id: string, patch: Partial<Omit<MediaData, 'id'>>) => void;
  clear: () => void;
  next: () => MediaData | undefined;

  activeCount: number
  pendingCount: number
  retryingCount: number
  errorCount: number
  hasFailed: boolean
  isUploading: boolean
}

export const useUploadQueueStore = create<UploadQueueState>((set, get) => ({
  queue: [],

  activeCount: get().queue.filter(i => i.uploadState.status === "uploading").length,
  pendingCount: get().queue.filter(i => i.uploadState.status === "pending").length,
  retryingCount: get().queue.filter(i => i.uploadState.status === "retrying").length,
  errorCount: get().queue.filter(i => i.uploadState.status === "failed").length,
  hasFailed: get().errorCount > 0,
  isUploading: get().activeCount > 0 || get().retryingCount > 0 || get().pendingCount > 0,

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

  update: (id, patch) =>
    set((state) => ({
      queue: state.queue.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    })),

  clear: () => set({ queue: [] }),

  next: () => get().queue.find((i) => i.uploadState.status === "pending"),
}));