import { extractBackendMsg } from '@/api/models/apiResponse';
import { MediaData } from '@/constants/media';
import { useMediaStore } from '@/utils/mediaStore';
import { useEffect, useRef } from 'react';
import { useUploadMedia } from './useUploadMedia';

interface UseUploadWorkerOptions {
  concurrency?: number;
  enabled?: boolean;
  maxRetries?: number;
  baseRetryDelayMs?: number;
  maxRetryDelayMs?: number;
}


export function useAutoUploadWorker({
  concurrency = 3,
  enabled = true,
  maxRetries = 3,
  baseRetryDelayMs = 1000,
  maxRetryDelayMs = 30000,
}: UseUploadWorkerOptions) {
  const queue = useMediaStore((s) => s.media);
  const nonCompId = useMediaStore((s) => s.noncompositeCrumbId);

  const { upload } = useUploadMedia({});
  const activeRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled) return;

    const active = activeRef.current;

    // forget items that have been removed
    const liveIds = new Set(
      useMediaStore.getState().media.map((i) => i.id),
    );
    for (const id of active) {
      if (!liveIds.has(id)) active.delete(id);
    }

    const start = async (item: MediaData) => {
      active.add(item.id);

      try {
       await upload(item, nonCompId);
      } catch (error) {
        console.error(
          `upload failed for ${item.id}:`,
          extractBackendMsg(error),
        );
      }

      active.delete(item.id);
      pump();
    };

    const pump = () => {
      while (active.size < concurrency) {
        const item = useMediaStore.getState().next();
        if (!item) break;
        void start(item);
      }
    };

    pump();
  }, [concurrency, enabled, nonCompId, queue, upload, maxRetries, baseRetryDelayMs, maxRetryDelayMs]);
}