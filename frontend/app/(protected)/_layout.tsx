import { useThemeColor } from "@/hooks/useThemeColor";
import { Stack } from "expo-router";

export default function ProtectedLayout() {
  const theme = useThemeColor
  const headerBg = theme({}, "background")
  const headerText = theme({}, "text")
  return (
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
      <Stack.Screen name="(main)" />
      <Stack.Screen name="find-friends" options={{
        title: "Friend requests",
      }} />
      <Stack.Screen name="invite-friends" options={{
        title: "My Contacts",
      }} />
      <Stack.Screen name="profile-settings" options={{
        title: "Profile",
      }} />
    </Stack>
  )
}