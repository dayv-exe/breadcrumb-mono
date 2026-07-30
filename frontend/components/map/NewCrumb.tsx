import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation } from "expo-router";
import { ChevronDownIcon } from "lucide-react-native";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NavigatableBottomSheetView from "../bottomsheet/NavigatableBottomSheetView";
import CustomButton from "../buttons/CustomButton";
import CameraView from "../camera/CameraView";
import CustomLabel from "../CustomLabel";

type NewCrumbParams = {
  camera: { screenHeight: number, address: string, closeSheet: () => void }
  preview: undefined
}

type props = {
  screenHeight: number
  address: string
  closeSheet: () => void
}

function CameraPage({ screenHeight, address, closeSheet }: { screenHeight: number, address: string, closeSheet: () => void }) {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<StackNavigationProp<NewCrumbParams>>()

  return (
    <View
      style={{
        height: screenHeight,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          position: "absolute",
          top: insets.top,
          paddingHorizontal: 20,
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <View
          style={{
            position: "absolute",
            width: "100%",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CustomLabel labelText={`New`} fontSize={21} bold padding={0} width="100%" textAlign="center" />
          {address && <CustomLabel labelText={address.split(",")[0]} allowTruncate fontSize={13} fade padding={0}
            customStyle={{
              textAlign: "center",
              maxWidth: "45%",
            }}
          />}
        </View>

        <CustomButton
          freed
          type="text"
          customStyle={{
            position: "absolute",
            right: 20
          }}
          handleClick={() => {
            console.log("closing")
            closeSheet()
          }}
        >
          <ChevronDownIcon stroke={"white"} strokeWidth={3} size={27} />
        </CustomButton>
      </View>
      <View
        style={{

        }}
      >
        <CameraView />
      </View>
    </View>
  )
}

function PreviewPage() {
  return (
    <View
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "red"
      }}
    >
      <CustomLabel adaptToTheme labelText="Previewing..." />
    </View>
  )
}

export default function NewCrumb({ closeSheet, screenHeight, address }: props) {


  return (
    <NavigatableBottomSheetView<NewCrumbParams>
      height={screenHeight}
      initialRouteName="camera"
      screenOptions={{
        headerShown: false,
      }}
      screens={[
        { name: "camera", component: CameraPage, initialParams: { address: address, screenHeight: screenHeight, closeSheet } },
        { name: "preview", component: PreviewPage },
      ]}
    />
  )
}