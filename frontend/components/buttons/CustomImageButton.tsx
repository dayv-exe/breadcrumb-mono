import { buttonTypes } from "@/constants/buttonTypes";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import { ActivityIndicator, Image } from "react-native";
import CustomFloatingSquare from "./CustomFloatingSquare";

type props = {
  size?: number
  src: any
  flat?: boolean
  type?: buttonTypes
  fitToContent?: boolean
  isPending?: boolean
  handleClick?: () => void
}

export default function CustomImageButton({ size = 23, src, handleClick, flat = false, type = "themed", fitToContent = false, isPending = false, }: props) {
  const mode = useColorScheme()

  const getLoadingColor = () => {
    return mode === "light" ? "#222" : "#fff"
  }

  return (
    <CustomFloatingSquare handleClick={handleClick} isFlat={flat} type={type} fitToContent={fitToContent}>
      {isPending && <ActivityIndicator color={getLoadingColor()} style={{ width: size, height: size }} />}
      {!isPending && <Image style={[{ width: size, height: size }]} source={src} />}
    </CustomFloatingSquare>
  )
}