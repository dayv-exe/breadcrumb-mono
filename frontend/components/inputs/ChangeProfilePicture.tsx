import useChangeProfilePicture from "@/hooks/useChangeProfilePicture";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomButton from "../buttons/CustomButton";


export default function ChangeProfilePicture({ cleanupFn }: { cleanupFn?: () => void }) {
  const insets = useSafeAreaInsets()
  const { chooseFromGallery, removePhoto, takeNewPhoto } = useChangeProfilePicture({ cleanUpFn: cleanupFn })

  return (
    <View style={{ paddingBottom: insets.bottom }}>
      <CustomButton type="text" labelText="Choose from photos" adaptToTheme handleClick={chooseFromGallery} />
      <CustomButton type="text" labelText="Take photo" adaptToTheme handleClick={takeNewPhoto} />
      <CustomButton type="text" labelText="Remove" customTextStyle={{ color: "red" }} adaptToTheme handleClick={removePhoto} />
    </View>
  )
}