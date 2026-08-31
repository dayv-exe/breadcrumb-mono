import { MediaData } from '@/constants/media';
import { useMediaStore } from '@/utils/mediaStore';
import { useUploadQueue } from '@/utils/uploadQueue';
import { useRef } from 'react';
import { useUploadMedia } from './useUploadMedia';

interface UseConcurrentUploadOptions {
  concurrency?: number;
  maxRetries?: number;
  baseRetryDelayMs?: number;
  maxRetryDelayMs?: number;
}


export function useConcurrentMediaUpload({
  concurrency = 3,
  maxRetries = 3,
  baseRetryDelayMs = 1000,
  maxRetryDelayMs = 10000,
}: UseConcurrentUploadOptions) {
  const nonCompId = useMediaStore((s) => s.noncompositeCrumbId);
  const { upload } = useUploadMedia({
    baseDelayMs: baseRetryDelayMs,
    maxDelayMs: maxRetryDelayMs,
    maxRetries: maxRetries,
  });
  const activeRef = useRef<Set<string>>(new Set());
  const begin = (): Promise<void> => {
    const active = activeRef.current;

    // forget items that have been removed
    const liveIds = new Set(useMediaStore.getState().media.map((i) => i.id));
    for (const id of active) {
      if (!liveIds.has(id)) active.delete(id);
    }

    return new Promise<void>((resolve) => {
      const start = async (item: MediaData) => {
        await upload(item, nonCompId);
        active.delete(item.id);
        pump();
      };

      const pump = () => {
        while (active.size < concurrency) {
          const item = useUploadQueue.getState().next();
          if (!item) break;
          void start(item);
        }
        if (active.size === 0) resolve();
      };

      pump();
    });
  };

  return {
    begin,
  }
}