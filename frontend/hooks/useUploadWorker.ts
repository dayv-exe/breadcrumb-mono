import { MediaData } from '@/constants/media';
import { useUploadQueueStore } from '@/utils/uploadStore';
import { useEffect, useRef } from 'react';

export type UploadFn = (
  item: MediaData,
  helpers: {
    signal: AbortSignal;
    onProgress: (progress: number) => void;
  },
) => Promise<void>;

interface UseUploadWorkerOptions {
  uploadFn: UploadFn;
  concurrency?: number;
  enabled?: boolean;
}

export function useUploadWorker({
  uploadFn,
  concurrency = 3,
  enabled = true,
}: UseUploadWorkerOptions) {
  const queue = useUploadQueueStore((s) => s.queue);
  const activeRef = useRef<Map<string, AbortController>>(new Map());

  useEffect(() => {
    if (!enabled) return;

    const store = useUploadQueueStore.getState;
    const active = activeRef.current;

    // Cancel uploads whose items were removed from the queue.
    const liveIds = new Set(store().queue.map((i) => i.id));
    for (const [id, controller] of active) {
      if (!liveIds.has(id)) {
        controller.abort();
        active.delete(id);
      }
    }

    const start = async (item: MediaData) => {
      const controller = new AbortController();
      active.set(item.id, controller);
      useUploadQueueStore.getState().update(item.id, {
        uploadState: {
          status: "uploading",
          error: null,
          progress: 0,
        }
      });

      try {
        await uploadFn(item, {
          signal: controller.signal,
          onProgress: (progress) =>
            useUploadQueueStore.getState().update(item.id, {
              ...item, uploadState: {
                ...item.uploadState,
                progress: Math.max(0, Math.min(100, progress)),
              }
            }),
        });
        if (!controller.signal.aborted) {
          useUploadQueueStore
            .getState()
            .update(item.id, {
              ...item, uploadState: {
                ...item.uploadState,
                progress: 100,
                status: "complete",
              }
            });
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          useUploadQueueStore.getState().update(item.id, {
            ...item, uploadState: {
              ...item.uploadState,
              error: err instanceof Error ? err : Error(String(err)),
              status: "failed",
            }
          });
        }
      }

      active.delete(item.id);
      pump();
    };

    // Fill open slots with pending items. next() returns the first 'pending'
    // item, and start() flips status synchronously, so each loop picks a new one.
    const pump = () => {
      while (active.size < concurrency) {
        const item = useUploadQueueStore.getState().next();
        if (!item) break;
        void start(item);
      }
    };

    pump();
  }, [concurrency, enabled, queue, uploadFn]);

  // On unmount, abort everything in flight.
  useEffect(() => {
    const active = activeRef.current;
    return () => {
      for (const controller of active.values()) controller.abort();
      active.clear();
    };
  }, []);

  const activeCount = queue.filter((i) => i.uploadState.status === "uploading").length;
  const pendingCount = queue.filter((i) => i.uploadState.status === "pending").length;
  return { activeCount, pendingCount, isUploading: activeCount > 0 };
}