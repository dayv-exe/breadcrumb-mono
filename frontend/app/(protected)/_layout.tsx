import { LiveEventsProvider } from "@/components/LiveEventsProvider";
import { CameraProvider } from "@/context/CameraContext";
import { useCrumb } from "@/hooks/useCrumb";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuthStore } from "@/utils/authStore";
import { useInitializeLocationTracking } from "@/utils/useLocationStore";
import { Stack } from "expo-router";

export default function ProtectedLayout() {
  const headerBg = useThemeColor({}, "background")
  const headerText = useThemeColor({}, "text")
  useInitializeLocationTracking()
  const userid = useAuthStore(s => s.userid)
  const { fetchLatestCrumb } = useCrumb()

  return (
    <CameraProvider>
      <LiveEventsProvider
        onBeforeConnect={async userid => {
          fetchLatestCrumb(userid)
        }}
        userid={userid}
      >
        <Stack screenOptions={{
          headerShown: false,
          headerBackButtonDisplayMode: "minimal",
          headerStyle: {
            backgroundColor: headerBg,
          },
          headerBackTitle: "back",
          headerTintColor: headerText,
          headerShadowVisible: false,
        }}>
          <Stack.Screen name="(home)" />
        </Stack>
      </LiveEventsProvider>
    </CameraProvider>
  )
}