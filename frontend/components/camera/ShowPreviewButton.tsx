import { StyleProp, ViewStyle } from "react-native";
import PreviewBunch from "./PreviewBunch";

interface props {
  style: StyleProp<ViewStyle>
}

export default function ShowPreviewButton({ style }: props) {
  return (
    <PreviewBunch />
  )
}