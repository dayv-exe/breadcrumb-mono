import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuthStore } from "@/utils/authStore";
import { Stack } from "expo-router";

export default function AuthLayout() {
  const {showEmailVerificationPage} = useAuthStore()
  const bgCol = useThemeColor({}, "background")
  const textCol = useThemeColor({}, "text")

  return (
    <Stack screenOptions={{
      headerStyle: {
        backgroundColor: bgCol,
      },
      headerTintColor: textCol,
      headerShadowVisible: false,
      headerShown: false
    }}>
      <Stack.Protected guard={!showEmailVerificationPage}>
        <Stack.Screen name="index" options={{ title: "" }} />
        <Stack.Screen name="signup-name" options={{ title: "Name", headerShown: true }} />
        <Stack.Screen name="signup-birthdate" options={{ title: "Age", headerShown: true }} />
        <Stack.Screen name="signup-login-details" options={{ title: "Login details", headerShown: true }} />
        <Stack.Screen name="login" options={{ title: "Login", headerShown: true }} />
        <Stack.Screen name="forgot-password" options={{ title: "Reset password", headerShown: true }} />
      </Stack.Protected>

      <Stack.Protected guard={showEmailVerificationPage}>
        <Stack.Screen name="signup-verify" options={{title: "Complete registration"}} />
      </Stack.Protected>
    </Stack>
  )
}