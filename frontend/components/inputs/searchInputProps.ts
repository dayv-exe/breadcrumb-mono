import { TextInput, TextStyle, ViewStyle } from "react-native"

export type searchInputProps = {
  value: string
  ref: React.RefObject<TextInput | null>
  handleChange: (s: string) => void
  handleOnFocus?: () => void
  handleOnBlur?: () => void
  placeholder?: string
  borderRadius?: number
  imageSize?: number
  useRedBorders?: boolean
  customStyle?: ViewStyle | ViewStyle[]
  customInputStyle?: TextStyle | TextStyle[]
  solidAppearance?: boolean
}