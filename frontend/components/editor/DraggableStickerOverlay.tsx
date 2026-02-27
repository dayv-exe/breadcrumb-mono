import { StickerOverlay } from "@/constants/media";
import { useKeyboardListener } from "@/hooks/useKeyboardListiner";
import { useMediaStore } from "@/utils/mediaStore";
import { useRef, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { useShallow } from "zustand/shallow";
import DraggableItem from "./DraggableItem";

type props = {
  overlay: StickerOverlay
  onDragStart?: () => void;
  onDragMove?: (absoluteX: number, absoluteY: number) => void;
  onDragEnd?: (absoluteX: number, absoluteY: number) => void;
}

export default function DraggableStickerOverlay({ overlay, onDragEnd, onDragMove, onDragStart }: props) {
  const [hide, setHide] = useState(false)
  const { updateCurrentMediaOverlay } = useMediaStore(useShallow(s => ({
    updateCurrentMediaOverlay: s.updateCurrentMediaOverlay,
  })))
  const newTrans = useRef(overlay.transform)

  const saveChanges = () => {
    const updatedOverlay: StickerOverlay = {
      emoji: overlay.emoji,
      id: overlay.id,
      size: overlay.size,
      transform: newTrans.current,
      type: "sticker"
    }
    updateCurrentMediaOverlay(overlay.id, updatedOverlay)
  }

  useKeyboardListener({
    onShow: () => {
      //setHide(true)
    },
    onWillHide: () => {
      //setHide(false)
    },
  });

  return (
    <DraggableItem
      locks={{}}
      style={{ opacity: hide ? 0 : 1, zIndex: 9 }}
      key={overlay.id}
      initialTransform={overlay.transform}
      onTransformEnd={t => {
        newTrans.current = t
        saveChanges()
      }}
      onDragEnd={onDragEnd}
      onDragMove={onDragMove}
      onDragStart={onDragStart}
    >
      <Text style={{fontSize: overlay.size, backgroundColor: "Red"}}>{overlay.emoji}</Text>
    </DraggableItem>
  );
}

const styles = StyleSheet.create({
  
})