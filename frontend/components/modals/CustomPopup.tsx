import { useThemeColor } from '@/hooks/useThemeColor';
import React, { PropsWithChildren } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import CustomKeyboardAvoidingView from '../views/CustomKeyboardAvoidingView';

type props = {
  show: boolean
  overrideDefaultBg?: boolean
  handleClose: () => void
}

export default function CustomPopup({ show, handleClose, children, overrideDefaultBg }: PropsWithChildren<props>) {
  const bgCol = useThemeColor({}, "background")
  const bgOverlay = useThemeColor({}, "backgroundOverlay")
  return (

    <Modal
      animationType="fade"
      transparent={true}
      visible={show}
      onRequestClose={handleClose}
    >
      {!overrideDefaultBg && <CustomKeyboardAvoidingView verticalOffset={-200} customStyle={[
        styles.modalBackground,
        { backgroundColor: bgOverlay }
      ]}>
        <View style={[
          styles.modalContainer,
          {
            backgroundColor: bgCol
          }
        ]}>
          {children}
        </View>
      </CustomKeyboardAvoidingView>}
      {overrideDefaultBg &&
        <>
          {children}
        </>
      }
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: 300,
    borderRadius: 25,
    padding: 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: .3,
    shadowRadius: 5,
  },
});
