import { useAutoUploadWorker } from "@/hooks/useAutoUploadWorker";
import { useUnlockCrumb } from "@/hooks/useUnlockCrumb";
import { Stack } from "expo-router";

const screenOptions = { headerShown: false } as const;

function UnlockCrumb() {
  useUnlockCrumb()
  return null
}

export default function MainScreen() {
  useAutoUploadWorker({ concurrency: 2, enabled: true })

  return (
    <>
      <UnlockCrumb />
      <Stack screenOptions={screenOptions}>
        <Stack.Screen name="map" />
      </Stack>
    </>
  );
}