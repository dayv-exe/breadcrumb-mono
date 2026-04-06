import CustomModal from '@/components/modals/CustomModal';
import React, { createContext, ReactNode, useContext, useState } from 'react';
import CustomPopup from './CustomPopup';

type ModalOptions = {
  message?: string;
  primaryBtnText?: string;
  secondaryBtnText?: string;
  showCancelBtn?: boolean
  onPrimary?: () => void
  onSecondary?: () => void
  content?: ReactNode
  overrideDefaultBg?: boolean
};

type ModalContextType = {
  showModal: (options: ModalOptions) => Promise<boolean>;
  hideModal: () => void;
};

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalOptions, setModalOptions] = useState<ModalOptions | null>(null);
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  const showModal = (options: ModalOptions): Promise<boolean> => {
    setModalOptions(options);
    setModalVisible(true);
    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve);
    });
  };

  const hideModal = () => {
    setModalVisible(false);
    resolver?.(false);
  };

  const handlePrimaryAction = () => {
    modalOptions?.onPrimary?.()
  };

  const handleSecondaryAction = () => {
    modalOptions?.onSecondary?.()
  };

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      {children}
      {modalOptions && !modalOptions.content && <CustomModal
        show={modalVisible}
        message={modalOptions.message}
        primaryBtnText={modalOptions.primaryBtnText}
        secondaryBtnText={modalOptions.secondaryBtnText}
        handleClose={hideModal}
        handlePrimaryAction={handlePrimaryAction}
        handleSecondaryAction={handleSecondaryAction}
        showCancelBtn={modalOptions.showCancelBtn}
      />}
      {
        modalOptions && modalOptions.content &&
        <CustomPopup handleClose={hideModal} show={modalVisible} overrideDefaultBg={modalOptions.overrideDefaultBg}>
          {modalOptions.content}
        </CustomPopup>
      }
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) throw new Error('useModal must be used within a ModalProvider');
  return context;
};
