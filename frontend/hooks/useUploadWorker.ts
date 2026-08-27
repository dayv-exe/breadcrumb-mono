import { extractBackendMsg } from '@/api/models/apiResponse';
import { MediaData } from '@/constants/media';
import { useMediaStore } from '@/utils/mediaStore';
import { useUploadQueueStore } from '@/utils/uploadStore';
import { useEffect, useRef } from 'react';
import { useMediaUpload } from './useMediaUpload';

interface UseUploadWorkerOptions {
  concurrency?: number;
  enabled?: boolean;
  maxRetries?: number;
  baseRetryDelayMs?: number;
  maxRetryDelayMs?: number;
  isRetryable?: (error: unknown) => boolean;
}

function defaultIsRetryable(error: unknown): boolean {
  const status =
    (error as { status?: number })?.status ??
    (error as { response?: { status?: number } })?.response?.status;

  if (typeof status === 'number') {
    if (status === 408 || status === 429) return true;
    return status >= 500 && status < 600;
  }

  // no status usually means a network error
  return true;
}

export function useUploadWorker({
  concurrency = 3,
  enabled = true,
  maxRetries = 3,
  baseRetryDelayMs = 1000,
  maxRetryDelayMs = 30000,
  isRetryable = defaultIsRetryable,
}: UseUploadWorkerOptions) {
  const queue = useUploadQueueStore((s) => s.queue);
  const nonCompId = useMediaStore((s) => s.noncompositeCrumbId);

  const { upload } = useMediaUpload();
  const activeRef = useRef<Set<string>>(new Set());
  const attemptsRef = useRef<Map<string, number>>(new Map());
  const retryTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  useEffect(() => {
    const timers = retryTimersRef.current;
    return () => {
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const active = activeRef.current;
    const attempts = attemptsRef.current;
    const retryTimers = retryTimersRef.current;

    // forget items that have been removed
    const liveIds = new Set(
      useUploadQueueStore.getState().queue.map((i) => i.id),
    );
    for (const id of active) {
      if (!liveIds.has(id)) active.delete(id);
    }
    for (const id of [...attempts.keys()]) {
      if (!liveIds.has(id)) attempts.delete(id);
    }
    for (const [id, timer] of retryTimers) {
      if (!liveIds.has(id)) {
        clearTimeout(timer);
        retryTimers.delete(id);
      }
    }

    const scheduleRetry = (
      item: MediaData,
      attempt: number,
      error: unknown,
    ) => {
      const delay =
        Math.min(maxRetryDelayMs, baseRetryDelayMs * 2 ** (attempt - 1)) +
        Math.random() * 250;

      useUploadQueueStore.getState().update(item.id, {
        uploadState: {
          status: 'retrying',
          error: error instanceof Error ? error : new Error(String(error)),
          attempt,
          nextRetryAt: Date.now() + delay,
        },
      });

      const timer = setTimeout(() => {
        retryTimers.delete(item.id);
        // Flip back to pending so pump() picks it up on the next tick.
        useUploadQueueStore.getState().update(item.id, {
          uploadState: { status: 'pending', error: null },
        });
        pump();
      }, delay);

      retryTimers.set(item.id, timer);
    };

    const start = async (item: MediaData) => {
      active.add(item.id);
      const attempt = (attempts.get(item.id) ?? 0) + 1;
      attempts.set(item.id, attempt);

      useUploadQueueStore.getState().update(item.id, {
        uploadState: { status: 'uploading', error: null, attempt },
      });

      try {
        await upload([item], nonCompId);
        attempts.delete(item.id);
        useUploadQueueStore.getState().update(item.id, {
          uploadState: { status: 'complete', error: null },
        });
      } catch (error) {
        const canRetry = attempt <= maxRetries && isRetryable(error);

        if (canRetry) {
          console.warn(
            `upload failed for ${item.id} (attempt ${attempt}/${maxRetries}), retrying:`,
            extractBackendMsg(error),
          );
          scheduleRetry(item, attempt, error);
        } else {
          attempts.delete(item.id);
          useUploadQueueStore.getState().update(item.id, {
            uploadState: {
              status: 'failed',
              error: error instanceof Error ? error : new Error(String(error)),
              attempt,
            },
          });
          console.error(
            `upload failed permanently for ${item.id}:`,
            extractBackendMsg(error),
          );
        }
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
  }, [
    concurrency,
    enabled,
    nonCompId,
    queue,
    upload,
    maxRetries,
    baseRetryDelayMs,
    maxRetryDelayMs,
    isRetryable,
  ]);
}