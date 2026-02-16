import { useCallback, useRef, useState } from "react";
import { LayoutRectangle } from "react-native";

type DropZoneConfig = {
  /** Extra padding around the zone that still counts as "inside" */
  hitSlop?: number;
  onEnter?: () => void;
  onLeave?: () => void;
  onDrop?: () => void;
};

export function useDropZone({
  hitSlop = 0,
  onEnter,
  onLeave,
  onDrop,
}: DropZoneConfig = {}) {
  const [isActive, setIsActive] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const layoutRef = useRef<LayoutRectangle | null>(null);
  const wasInsideRef = useRef(false);

  /** Attach to the drop zone View's onLayout */
  const onLayout = useCallback(
    (e: { nativeEvent: { layout: LayoutRectangle } }) => {
      layoutRef.current = e.nativeEvent.layout;
    },
    []
  );

  const isInsideZone = useCallback(
    (absoluteX: number, absoluteY: number): boolean => {
      const zone = layoutRef.current;
      if (!zone) return false;

      return (
        absoluteX >= zone.x - hitSlop &&
        absoluteX <= zone.x + zone.width + hitSlop &&
        absoluteY >= zone.y - hitSlop &&
        absoluteY <= zone.y + zone.height + hitSlop
      );
    },
    [hitSlop]
  );

  const handleDragStart = useCallback(() => {
    setIsVisible(true);
    wasInsideRef.current = false;
  }, []);

  const handleDragMove = useCallback(
    (absoluteX: number, absoluteY: number) => {
      const inside = isInsideZone(absoluteX, absoluteY);

      if (inside && !wasInsideRef.current) {
        wasInsideRef.current = true;
        setIsActive(true);
        onEnter?.();
      } else if (!inside && wasInsideRef.current) {
        wasInsideRef.current = false;
        setIsActive(false);
        onLeave?.();
      }
    },
    [isInsideZone, onEnter, onLeave]
  );

  const handleDragEnd = useCallback(
    (absoluteX: number, absoluteY: number) => {
      const inside = isInsideZone(absoluteX, absoluteY);

      if (inside) {
        onDrop?.();
      }

      setIsActive(false);
      setIsVisible(false);
      wasInsideRef.current = false;
    },
    [isInsideZone, onDrop]
  );

  return {
    /** Whether the finger is currently inside the zone */
    isActive,
    /** Whether a drag is in progress (zone should be shown) */
    isVisible,
    /** Attach to the zone View's onLayout */
    onLayout,
    /** Pass to DraggableItem's onDragStart */
    handleDragStart,
    /** Pass to DraggableItem's onDragMove */
    handleDragMove,
    /** Pass to DraggableItem's onDragEnd */
    handleDragEnd,
  };
}