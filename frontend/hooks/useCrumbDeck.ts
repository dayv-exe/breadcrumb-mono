import { Crumb } from "@/api/models/crumb"; // adjust to wherever your Crumb type lives
import { crumbMedia } from "@/api/models/crumbMedia";
import { VISIBLE_DEPTH } from "@/constants/appConstants";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StackItem, VisibleCard } from "./types/crumbStack";

/**
 * Owns the deck's state: which card is on top, which one is flying away,
 * and which cards should currently be rendered (and at what depth).
 */
export function useCrumbDeck(
  crumbs: Crumb[],
  onReveal?: (crumb: Crumb, media: crumbMedia, index: number) => void
) {
  // Every media item of every crumb becomes one card.
  const items = useMemo<StackItem[]>(
    () =>
      crumbs
        .flatMap(crumb => crumb.media.map((media, i) => ({ key: `${crumb.id}-${i}`, crumb, media })))
        .map((item, index) => ({ ...item, index })),
    [crumbs]
  );

  const [top, setTop] = useState(0);
  const [exitingKey, setExitingKey] = useState<string | null>(null);

  useEffect(() => {
    const item = items[top];
    if (item) onReveal?.(item.crumb, item.media, top);
  }, [top, items]);

  /** Start flinging the top card away. */
  const startExit = useCallback(() => {
    const item = items[top];
    if (item) setExitingKey(item.key);
  }, [items, top]);

  /** Called by the top card once its exit animation is done. */
  const handleExited = useCallback(() => {
    setTop(t => t + 1);
    setExitingKey(null);
  }, []);

  const visible = useMemo<VisibleCard[]>(() => {
    // Render one extra (invisible) card so it can fade in at the back.
    const slice = items.slice(top, top + VISIBLE_DEPTH + 1);
    // Cards behind move up as soon as the top one starts leaving.
    const shift = exitingKey ? 1 : 0;
    return slice.map((item, i) => {
      const exiting = item.key === exitingKey;
      return { item, exiting, depth: exiting ? 0 : Math.max(0, i - shift) };
    });
  }, [items, top, exitingKey]);

  return {
    visible,
    isAnimating: exitingKey !== null,
    isLast: top >= items.length - 1,
    startExit,
    handleExited,
  };
}