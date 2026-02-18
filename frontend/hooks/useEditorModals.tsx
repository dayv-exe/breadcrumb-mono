import CustomButton from "@/components/buttons/CustomButton";
import ColorPicker from "@/components/editor/ColorPicker";
import FontSizePicker from "@/components/editor/FontSizePicker";
import { useModal } from "@/components/modals/ModalContext";
import React, { useCallback } from "react";

interface UseEditorModalsParams {
  bgColor: string;
  textColor: string;
  fontSize: number;
  onBgColorSelect: (color: string) => void;
  onTextColorSelect: (color: string) => void;
  onFontSizeSelect: (size: number) => void;
}

export function useEditorModals({
  bgColor,
  textColor,
  fontSize,
  onBgColorSelect,
  onTextColorSelect,
  onFontSizeSelect,
}: UseEditorModalsParams) {
  const { showModal, hideModal } = useModal();

  const openBgColorPicker = useCallback(() => {
    showModal({
      content: (
        <>
          <ColorPicker
            currentColor={bgColor}
            title="Background Color"
            onSelect={onBgColorSelect}
            onClose={hideModal}
          />
          <CustomButton labelText="Cancel" handleClick={hideModal} type="less-prominent" />
        </>
      ),
    });
  }, [bgColor, onBgColorSelect, showModal, hideModal]);

  const openTextColorPicker = useCallback(() => {
    showModal({
      content: (
        <>
          <ColorPicker
            currentColor={textColor}
            title="Text Color"
            onSelect={onTextColorSelect}
            onClose={hideModal}
          />
          <CustomButton labelText="Cancel" handleClick={hideModal} type="less-prominent" />
        </>
      ),
    });
  }, [textColor, onTextColorSelect, showModal, hideModal]);

  const openFontSizePicker = useCallback(() => {
    showModal({
      content: (
        <>
          <FontSizePicker
            currentSize={fontSize}
            onSelect={onFontSizeSelect}
            onClose={hideModal}
          />
          <CustomButton labelText="Cancel" handleClick={hideModal} type="less-prominent" />
        </>
      ),
    });
  }, [fontSize, onFontSizeSelect, showModal, hideModal]);

  return {
    openBgColorPicker,
    openTextColorPicker,
    openFontSizePicker,
  };
}