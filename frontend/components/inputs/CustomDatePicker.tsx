import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme.web';
import { useThemeColor } from '@/hooks/useThemeColor';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, View } from 'react-native';
import CustomButton from '../buttons/CustomButton';
import CustomLabel from '../CustomLabel';
import Spacer from '../Spacer';

type props = {
  date: Date
  dateStr: string
  setDate: (date: Date) => void
  setPickerMoving: (b: boolean) => void
  adaptToTheme?: boolean
}

export default function CustomDatePicker({ date, dateStr, setPickerMoving, setDate, adaptToTheme }: props) {
  const [showPicker, setShowPicker] = useState(false)
  const mode = useColorScheme()
  const textColor = useThemeColor({}, "text")

  function handleChange(_: DateTimePickerEvent, selectedDate?: Date) {
    setDate(selectedDate ?? new Date())
    setShowPicker(false)
    setPickerMoving(false)
  }

  return (
    <>
      <View style={{ width: "100%" }}>
        <CustomLabel textColor={adaptToTheme ? textColor : Colors.dark.text} labelText="Birthdate:" bold />
        <CustomButton labelText={dateStr} adaptToTheme={adaptToTheme} type={adaptToTheme ? "theme-faded" : "faded"} handleClick={() => setShowPicker(true)} />
        <CustomLabel textColor={adaptToTheme ? textColor : Colors.light.text}  labelText="🔒 other users won't see this" fontSize={15} />
      </View>
      <Spacer />
      {(showPicker || Platform.OS === "ios") && <DateTimePicker
        testID="dateTimePicker"
        value={date}
        mode="date"
        onChange={handleChange}
        display="spinner"
        themeVariant={adaptToTheme ? (mode === "dark" ? "dark" : "light") : "dark"}
        onTouchMove={() => setPickerMoving(true)}
      />}
    </>
  )
}