import { useThemeColor } from '@/hooks/useThemeColor';
import { Modal, StyleSheet, Text, View } from 'react-native';
import CustomButton from '../buttons/CustomButton';
import Spacer from '../Spacer';

type mTypes = {
  title?: string
  message?: string
  show: boolean
  primaryBtnText?: string
  secondaryBtnText?: string
  showCancelBtn?: boolean

  handlePrimaryAction?: () => void
  handleSecondaryAction?: () => void
  handleClose?: () => void
}

export default function CustomModal({ title = "message", message = "Hello world!", show, primaryBtnText, secondaryBtnText, handlePrimaryAction, handleSecondaryAction, handleClose, showCancelBtn = false }: mTypes) {
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
            <Text numberOfLines={1} ellipsizeMode='tail' style={[
              {
                color: textCol,
                opacity: 1,
                fontWeight: "600",
                fontSize: 20,
                alignSelf: "flex-start",
                textAlign: "left",
              }
            ]}>{title}</Text>
            <Spacer size='small' />
            <Text style={[
              styles.modalText,
              {
                fontSize: 16,
                color: textCol,
                opacity: 1,
                fontWeight: 400,
              }
            ]}>{message}</Text>
          </View>
          <Spacer size='small' />
          <View style={styles.buttonContainer}>
            {primaryBtnText && <CustomButton labelText={primaryBtnText} handleClick={() => {
              handlePrimaryAction?.()
            }} type="less-prominent" customStyle={{
              flexGrow: 1,
              flexShrink: 1,
            }} />}
            {secondaryBtnText && <Spacer size='small' />}
            {secondaryBtnText && <CustomButton labelText={secondaryBtnText} handleClick={() => {
              handleSecondaryAction?.()
            }} type='theme-faded' customStyle={{
              flexGrow: 1,
              flexShrink: 1,
            }} />}
            {showCancelBtn &&
              <>
                <Spacer size='small' />
                <CustomButton customTextStyle={{ color: "red" }} type='text' labelText='cancel' adaptToTheme handleClick={handleClose} customStyle={{
                  flexGrow: 1,
                  flexShrink: 1,
                }} />
              </>
            }
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    width: "100%",
    flexDirection: "row-reverse",
    alignItems: "flex-end",
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
    width: "90%",
    borderRadius: 30,
    padding: 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: .3,
    shadowRadius: 5,
  },
  modalText: {
    fontSize: 17,
    textAlign: 'left',
    opacity: 1,
    lineHeight: 25
  },
  textContainer: {
    paddingHorizontal: 15,
    opacity: 1,
    fontWeight: "bold",
    alignItems: "flex-start",
  }
});
