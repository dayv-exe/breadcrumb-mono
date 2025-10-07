import { useThemeColor } from '@/hooks/useThemeColor';
import React, { useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import CustomButton from '../buttons/CustomButton';
import Spacer from '../Spacer';

type mTypes = {
  message?: string
  show: boolean
  closeBtnText?: string
  secondaryBtnText?: string
  handleClose?: () => void
  handleSecondaryAction?: () => void
}

export default function CustomModal({ message = "Hello world!", show, closeBtnText = "Okay", secondaryBtnText = "Not okay", handleClose=() => {}, handleSecondaryAction }: mTypes) {
  const theme = useThemeColor

  const [showSpinnerPri, setShowSpinnerPri] = useState(false)
  const [showSpinnerSec, setShowSpinnerSec] = useState(false)

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={show}
      onRequestClose={handleClose}
    >
      <View style={[
        styles.modalBackground,
        {backgroundColor: theme({}, "backgroundOverlay")}
      ]}>
        <View style={[
          styles.modalContainer,
          {
            backgroundColor: theme({}, "background")
          }
        ]}>
          <Text style={[
            styles.modalText,
            {
              color: theme({}, "text")
            }
          ]}>{message}</Text>
          <Spacer />
          <View style={styles.buttonContainer}>
            <CustomButton labelText={closeBtnText} handleClick={() => {
              setShowSpinnerPri(true)
              handleClose()
              // temporary work around maybe not best practice
              setInterval(() => setShowSpinnerPri(false), 1000)
            }} type={handleSecondaryAction ? "prominent" : "prominent"} isPending={showSpinnerPri} />
            {handleSecondaryAction && <Spacer />}
            {handleSecondaryAction && <CustomButton labelText={secondaryBtnText} handleClick={() => {
              setShowSpinnerSec(true)
              handleSecondaryAction()

              // temporary work around not best practice
              setInterval(() => setShowSpinnerSec(false), 1000)
            }} type='theme-faded' isPending={showSpinnerSec} />}
          </View>
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
    borderRadius: 15,
    padding: 20,
    elevation: 10,
  },
  modalText: {
    fontSize: 17,
    textAlign: 'center',
    opacity: .8,
    lineHeight: 25
  },
});
