import { useColorScheme } from '@/hooks/useColorScheme.web';
import { useAuthStore } from '@/utils/authStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Amplify } from "aws-amplify";
import Constants from 'expo-constants';
import { Stack } from "expo-router";
import { useEffect } from 'react';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast, { BaseToast, ToastProps } from 'react-native-toast-message';

const queryClient = new QueryClient()

const toastConfig = {
  info: (props: ToastProps) => {
    return (
      <BaseToast
        {...props}
        style={{
          backgroundColor: "#fff",
          borderRadius: 15,
          borderLeftWidth: 0,
          borderLeftColor: 'transparent',
          marginTop: props.position === "top" ? 20 : 0
        }}
        contentContainerStyle={{ padding: 15 }}
        text1Style={{
          fontSize: 16,
          color: "#222",
          fontWeight: "normal",
          overflow: "visible",
          wordWrap: "none"
        }}
        text2Style={{
          fontSize: 16,
          color: "#222",
        }}
      />
    )
  },

  warn: (props: ToastProps) => {
    return (
      <BaseToast
        {...props}
        style={{
          backgroundColor: "#fff",
          borderRadius: 15,
          borderLeftWidth: 0,
          borderLeftColor: 'transparent',
          marginTop: props.position === "top" ? 20 : 0
        }}
        contentContainerStyle={{ padding: 15 }}
        text1Style={{
          fontSize: 16,
          color: "red",
          fontWeight: "normal",
          overflow: "visible",
          wordWrap: "none"
        }}
        text2Style={{
          fontSize: 16,
          color: "red",
        }}
      />
    )
  }
}

const darkToastConfig = {
  info: (props: ToastProps) => {
    return (
      <BaseToast
        {...props}
        style={{
          backgroundColor: "#333",
          borderRadius: 15,
          borderLeftWidth: 0,
          borderLeftColor: 'transparent',
          marginTop: props.position === "top" ? 20 : 0
        }}
        contentContainerStyle={{ padding: 15 }}
        text1Style={{
          fontSize: 16,
          color: "#fff",
          fontWeight: "normal",
          overflow: "visible",
          wordWrap: "none"
        }}
        text2Style={{
          fontSize: 16,
          color: "#fff",
        }}
      />
    )
  },

  warn: (props: ToastProps) => {
    return (
      <BaseToast
        {...props}
        style={{
          backgroundColor: "#fff",
          borderRadius: 15,
          borderLeftWidth: 0,
          borderLeftColor: 'transparent',
          marginTop: props.position === "top" ? 20 : 0
        }}
        contentContainerStyle={{ padding: 15 }}
        text1Style={{
          fontSize: 16,
          color: "red",
          fontWeight: "normal",
          overflow: "visible",
          wordWrap: "none"
        }}
        text2Style={{
          fontSize: 16,
          color: "red",
        }}
      />
    )
  }
}

export default function RootLayout() {
  const { isLoggedIn, checkAuthStatus } = useAuthStore()
  const mode = useColorScheme()

  useEffect(() => {
    checkAuthStatus()
  }, [])

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: Constants.expoConfig?.extra?.userPoolId ?? "",
        userPoolClientId: Constants.expoConfig?.extra?.clientPoolId ?? "",
        signUpVerificationMethod: 'code',
      }
    },
  })

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{
          headerShown: false,
        }}>
          <Stack.Protected guard={!isLoggedIn}>
            <Stack.Screen name="(auth)" />
          </Stack.Protected>

          <Stack.Protected guard={isLoggedIn}>
            <Stack.Screen name="(protected)" />
          </Stack.Protected>

        </Stack>
        <Toast config={mode === "light" ? darkToastConfig : toastConfig} />
      </QueryClientProvider>
    </GestureHandlerRootView>
  )
}