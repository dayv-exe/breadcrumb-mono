import { TextOverlay as overlayType } from "@/constants/media";
import { useKeyboardListener } from "@/hooks/useKeyboardListiner";
import { useMediaStore } from "@/utils/mediaStore";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { TextInput } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useShallow } from "zustand/shallow";
import CustomButton from "../buttons/CustomButton";
import CustomInput from "../inputs/CustomInput";
import DraggableItem from "./DraggableItem";

type props = {
  overlay: overlayType
  handleRemoveOverlay: () => void
  onBlur: () => void
  focusOnMount: boolean
  onDragStart?: () => void;
  onDragMove?: (absoluteX: number, absoluteY: number) => void;
  onDragEnd?: (absoluteX: number, absoluteY: number) => void;
}

export default function DraggableTextOverlay({ overlay, handleRemoveOverlay, focusOnMount, onBlur, onDragEnd, onDragMove, onDragStart }: props) {
  const [text, setText] = useState(overlay.text)
  const inputRef = useRef<TextInput>(null)
  const [center, setCenter] = useState(false)
  const [hide, setHide] = useState(false)
  const { setEditing, updateCurrentMediaOverlay } = useMediaStore(useShallow(s => ({
    setEditing: s.setEditing,
    updateCurrentMediaOverlay: s.updateCurrentMediaOverlay,
  })))
  const newTrans = useRef(overlay.transform)
  const {top, right} = useSafeAreaInsets()

  const saveChanges = () => {
    if (text.trim().length < 1) return;
    updateCurrentMediaOverlay(overlay.id, {
      text: text,
      id: overlay.id,
      type: "text",
      fontSize: 1,
      color: "white",
      fontWeight: "bold",
      transform: newTrans.current
    })
  }

  useEffect(() => {
    if (focusOnMount) {
      inputRef.current?.focus()
    }
  }, [])

  const handleBlur = () => {
    if (text.trim().length < 1) {
      handleRemoveOverlay()
    }

    onBlur()
    saveChanges()

    setEditing(false)
  }

  const handleFocus = () => {
    setEditing(true)
  }

  useKeyboardListener({
    onShow: () => {
      if (inputRef.current?.isFocused()) {
        setCenter(true);
      } else {
        setHide(true)
      }
    },
    onWillHide: () => {
      setCenter(false);
      setHide(false)
    },
  });

  return (
    <>
      <DraggableItem
        locks={{ lockX: true, lockScale: true, lockRotation: true }}
        style={{ width: "100%", opacity: hide ? 0 : 1, zIndex: 10 }}
        key={overlay.id}
        initialTransform={overlay.transform}
        centerMode={center}
        onTransformEnd={t => {
          newTrans.current = t
          saveChanges()
        }}
        onDragEnd={onDragEnd}
        onDragMove={onDragMove}
        onDragStart={onDragStart}
      >
        <View style={styles.background}>
          <CustomInput ref={inputRef} customStyle={styles.input} customInputStyle={{ backgroundColor: "transparent", color: "white", width: "100%", textAlign: "center", padding: 10 }} hideActiveBorders multiline allowNewLines={false} labelText="" value={text} setValue={setText} onBlur={handleBlur} onFocus={handleFocus} />
        </View>
      </DraggableItem>
      {center && <CustomButton type="less-prominent" customStyle={{position: "absolute", top: top + 10, right: 10, paddingHorizontal: 20}} handleClick={() => {
        inputRef.current?.blur()
      }} labelText="Done" slim />}
    </>
  );
}

const styles = StyleSheet.create({
  background: {
    width: "100%",
    height: "auto",
    backgroundColor: "rgba(0, 0, 0, .7)",
  },
  input: {
    backgroundColor: "transparent",
  },
})