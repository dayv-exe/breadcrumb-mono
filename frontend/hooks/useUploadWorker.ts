import { extractBackendMsg } from '@/api/models/apiResponse';
import { MediaData } from '@/constants/media';
import { useMediaStore } from '@/utils/mediaStore';
import { useUploadQueueStore } from '@/utils/uploadStore';
import { useEffect, useRef } from 'react';
import { useMediaUpload } from './useMediaUpload';

interface UseUploadWorkerOptions {
  concurrency?: number;
  enabled?: boolean;
}

export function useUploadWorker({
  concurrency = 3,
  enabled = true,
}: UseUploadWorkerOptions) {
  const queue = useUploadQueueStore((s) => s.queue);
  const nonCompId = useMediaStore(s => s.noncompositeCrumbId)

  const { upload } = useMediaUpload();
  const activeRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled) return;

    const active = activeRef.current;

    // Forget items that were removed from the queue while in flight.
    const liveIds = new Set(
      useUploadQueueStore.getState().queue.map((i) => i.id),
    );
    for (const id of active) {
      if (!liveIds.has(id)) active.delete(id);
    }

    const start = async (item: MediaData) => {
      active.add(item.id);
      useUploadQueueStore.getState().update(item.id, {
        uploadState: { status: 'uploading', error: null },
      });

      try {
        console.log("uploading for item: ", item)
        await upload([item], nonCompId);
        useUploadQueueStore.getState().update(item.id, {
          uploadState: { status: 'complete', error: null },
        });
        console.log("done uploading item: ", item)
      } catch (error) {
        useUploadQueueStore.getState().update(item.id, {
          uploadState: {
            status: 'failed',
            error: error instanceof Error ? error : new Error(String(error)),
          },
        });
        console.log("error while uploading item: ", extractBackendMsg(error))
      }

      active.delete(item.id);
      pump();
    };

    const pump = () => {
      while (active.size < concurrency) {
        const item = useUploadQueueStore.getState().next();
        if (!item) break;
        void start(item);
      }
    };

    pump();
  }, [concurrency, enabled, nonCompId, queue, upload]);

  const activeCount = queue.filter(
    (i) => i.uploadState.status === 'uploading',
  ).length;
  const pendingCount = queue.filter(
    (i) => i.uploadState.status === 'pending',
  ).length;
  return { activeCount, pendingCount, isUploading: activeCount > 0 };
}