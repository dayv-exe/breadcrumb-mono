import { Colors } from "@/constants/Colors";
import { useAuthStore } from "@/utils/authStore";
import { Stack } from "expo-router";

export default function AuthLayout() {
  const {showEmailVerificationPage} = useAuthStore()

  return (
    <Stack screenOptions={{
      headerStyle: {
        backgroundColor: Colors.light.vibrantBackground,
      },
      headerTintColor: "#fff",
      headerShadowVisible: false,
    }}>
      <Stack.Protected guard={!showEmailVerificationPage}>
        <Stack.Screen name="index" options={{ title: "" }} />
        <Stack.Screen name="signup-name" options={{ title: "Name" }} />
        <Stack.Screen name="signup-birthdate" options={{ title: "Age" }} />
        <Stack.Screen name="signup-login-details" options={{ title: "Login details" }} />
        <Stack.Screen name="login" options={{ title: "Login" }} />
        <Stack.Screen name="forgot-password" options={{ title: "Reset password" }} />
      </Stack.Protected>

      <Stack.Protected guard={showEmailVerificationPage}>
        <Stack.Screen name="signup-verify" options={{title: "Complete registration"}} />
      </Stack.Protected>
    </Stack>
  )
}