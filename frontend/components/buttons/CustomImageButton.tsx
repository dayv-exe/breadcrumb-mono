import { buttonTypes } from "@/constants/buttonTypes";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import { ActivityIndicator, Image, StyleProp, ViewStyle } from "react-native";
import CustomFloatingSquare from "./CustomFloatingSquare";

type props = {
  size?: number
  src: any
  flat?: boolean
  type?: buttonTypes
  fitToContent?: boolean
  isPending?: boolean
  handleClick?: () => void
  customStyle?: StyleProp<ViewStyle>
}

export default function CustomImageButton({ size = 23, src, handleClick, flat = false, type = "themed", fitToContent = false, isPending = false, customStyle }: props) {
  const mode = useColorScheme()

  const getLoadingColor = () => {
    return mode === "light" ? "#222" : "#fff"
  }

  return (
    <CustomFloatingSquare customStyle={customStyle} handleClick={handleClick} isFlat={flat} type={type} fitToContent={fitToContent}>
      {isPending && <ActivityIndicator color={getLoadingColor()} style={{ width: size, height: size }} />}
      {!isPending && <Image style={[{ width: size, height: size }]} source={src} />}
    </CustomFloatingSquare>
  )
}