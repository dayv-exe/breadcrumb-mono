import { useDatabaseListener } from "@/hooks/queries/useLocalDatabase";
import { useAutoUploadWorker } from "@/hooks/useAutoUploadWorker";
import { useUnlockCrumb } from "@/hooks/useUnlockCrumb";
import { Stack } from "expo-router";

const screenOptions = { headerShown: false } as const;

function DbListener() {
  useDatabaseListener();
  return null;
}

function UnlockCrumb() {
  useUnlockCrumb()
  return null
}

export default function MainScreen() {
  useAutoUploadWorker({ concurrency: 2, enabled: true })

  return (
    <>
      <DbListener />
      <UnlockCrumb />
      <Stack screenOptions={screenOptions}>
        <Stack.Screen name="map" />
      </Stack>
    </>
  );
}