import { useAutoUploadWorker } from "@/hooks/useAutoUploadWorker";
import { Stack } from "expo-router";
export default function MainScreen() {
  useAutoUploadWorker({
    concurrency: 2,
    enabled: true,
  })

  return (
    <Stack screenOptions={{
      headerShown: false,
    }}>
      <Stack.Screen name="map" />
    </Stack>
  );
}