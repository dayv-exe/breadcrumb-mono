import { upsertCrumbs } from "@/api/db/crumbsDb";
import { useLiveEvent } from "@/components/LiveEventsProvider";
import { Stack } from "expo-router";

export default function LoggedIn() {
  useLiveEvent("crumb",
    crumb => upsertCrumbs([crumb])
  )
  return (
    <Stack screenOptions={{ headerShown: false }}>
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