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
}

export const useUploadQueueStore = create<UploadQueueState>((set, get) => ({
  queue: [],

  add: (item) => {
    item.uploadState = {
      error: null,
      progress: 0,
      status: "pending",
    }
    set((state) => ({ queue: [...state.queue, item] }))
  },

  addMany: (items) => {
    const created = items.map(item => {
      item.uploadState = {
        error: null,
        progress: 0,
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