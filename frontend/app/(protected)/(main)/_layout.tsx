import { useUploadWorker } from "@/hooks/useUploadWorker";
import { Stack } from "expo-router";
export default function MainScreen() {
  useUploadWorker({
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