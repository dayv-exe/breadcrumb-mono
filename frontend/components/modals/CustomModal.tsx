import { useThemeColor } from '@/hooks/useThemeColor';
import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import CustomButton from '../buttons/CustomButton';
import Spacer from '../Spacer';

type mTypes = {
  message?: string
  show: boolean
  primaryBtnText?: string
  secondaryBtnText?: string
  showCancelBtn?: boolean

  handlePrimaryAction?: () => void
  handleSecondaryAction?: () => void
  handleClose?: () => void
}

export default function CustomModal({ message = "Hello world!", show, primaryBtnText, secondaryBtnText, handlePrimaryAction, handleSecondaryAction, handleClose, showCancelBtn = false }: mTypes) {
  const bgCol = useThemeColor({}, "background")
  const bgOverlay = useThemeColor({}, "backgroundOverlay")
  const textCol = useThemeColor({}, "text")
  return (

    <Modal
      animationType="fade"
      transparent={true}
      visible={show}
      onRequestClose={handleClose}
    >
      <View style={[
        styles.modalBackground,
        { backgroundColor: bgOverlay }
      ]}>
        <View style={[
          styles.modalContainer,
          {
            backgroundColor: bgCol
          }
        ]}>
          <View style={styles.textContainer}>
            <Text style={[
              styles.modalText,
              {
                color: textCol
              }
            ]}>{message}</Text>
          </View>
          <Spacer />
          <View style={styles.buttonContainer}>
            {primaryBtnText && <CustomButton useMinWidth slim labelText={primaryBtnText} handleClick={() => {
              handlePrimaryAction?.()
            }} type="less-prominent" />}
            {secondaryBtnText && <Spacer size='small' />}
            {secondaryBtnText && <CustomButton useMinWidth slim labelText={secondaryBtnText} handleClick={() => {
              handleSecondaryAction?.()
            }} type='theme-faded' />}
            {showCancelBtn &&
              <>
                <Spacer size='small' />
                <CustomButton useMinWidth customTextStyle={{ color: "red" }} type='text' slim labelText='cancel' adaptToTheme handleClick={handleClose} />
              </>
            }
          </View>
          <Spacer  />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center"
  },
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
  modalText: {
    fontSize: 17,
    textAlign: 'center',
    opacity: 1,
    lineHeight: 25
  },
  textContainer: {
    paddingHorizontal: 20,
    opacity: 1,
    fontWeight: "bold"
  }
});
