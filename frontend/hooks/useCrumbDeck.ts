import { Crumb } from "@/api/models/crumb";
import { Media } from "@/api/models/media";
import { VISIBLE_DEPTH } from "@/constants/appConstants";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StackItem, VisibleCard } from "./types/crumbStack";

/**
 * Owns the deck's state: which card is on top, which one is flying away or flying back,
 * and which cards should currently be rendered (and at what depth).
 */
export function useCrumbDeck(
  crumbs: Crumb[],
  media: Media[],
  onReveal?: (crumb: Crumb, media: Media, index: number) => void
) {
  const items = useMemo<StackItem[]>(() => {
    const mediaByCrumb = new Map<string, Media[]>();
    for (const m of media) {
      if (!m.crumbId) continue;
      const list = mediaByCrumb.get(m.crumbId);
      if (list) list.push(m);
      else mediaByCrumb.set(m.crumbId, [m]);
    }

    return crumbs
      .flatMap(crumb =>
        (mediaByCrumb.get(crumb.id) ?? [])
          .sort((a, b) => a.index - b.index)
          .map(m => ({ key: `${crumb.id}-${m.index}`, crumb, media: m }))
      )
      .map((item, index) => ({ ...item, index }));
  }, [crumbs, media]);

  const [top, setTop] = useState(0);
  const [exitingKey, setExitingKey] = useState<string | null>(null);
  const [returningKey, setReturningKey] = useState<string | null>(null);

  // Reset when a new set of crumbs/media comes in — adjusted during render, not in an effect.
  const [prevItems, setPrevItems] = useState(items);
  if (items !== prevItems) {
    setPrevItems(items);
    setTop(0);
    setExitingKey(null);
    setReturningKey(null);
  }

  useEffect(() => {
    const item = items[top];
    if (item) onReveal?.(item.crumb, item.media, top);
  }, [top, items]);

  const startExit = useCallback(() => {
    const item = items[top];
    if (item) setExitingKey(item.key);
  }, [items, top]);

  const handleExited = useCallback(() => {
    setTop(t => t + 1);
    setExitingKey(null);
  }, []);

  const goBack = useCallback(() => {
    const previous = items[top - 1];
    if (!previous) return;
    setTop(top - 1);
    setReturningKey(previous.key);
  }, [items, top]);

  const handleReturned = useCallback(() => {
    setReturningKey(null);
  }, []);

  const visible = useMemo<VisibleCard[]>(() => {
    // Render one extra (invisible) card so it can fade in at the back.
    const slice = items.slice(top, top + VISIBLE_DEPTH + 1);
    // Cards behind move up as soon as the top one starts leaving.
    const shift = exitingKey ? 1 : 0;
    return slice.map((item, i) => {
      const exiting = item.key === exitingKey;
      return {
        item,
        exiting,
        returning: item.key === returningKey,
        depth: exiting ? 0 : Math.max(0, i - shift),
      };
    });
  }, [items, top, exitingKey, returningKey]);

  return {
    visible,
    isAnimating: exitingKey !== null || returningKey !== null,
    isFirst: top === 0,
    isLast: top >= items.length - 1,
    startExit,
    handleExited,
    goBack,
    handleReturned,
  };
}