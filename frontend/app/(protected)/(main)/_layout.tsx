import { Stack } from "expo-router";
export default function MainScreen() {
  return (
    <Stack screenOptions={{
      headerShown: false,
    }}>
      <Stack.Screen name="map" />
    </Stack>
  );
}