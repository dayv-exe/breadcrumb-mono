import { signupDetails } from "@/api/models/userDetails"
import { AuthError, confirmResetPassword, confirmSignUp, getCurrentUser, resendSignUpCode, resetPassword, signIn, signOut, signUp } from "aws-amplify/auth"
import { deleteItemAsync, getItem, setItem } from "expo-secure-store"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

interface iResponse { isSuccess: boolean, info?: any }

function isAuthError(error: unknown): error is AuthError {
  return typeof error === "object" && error !== null && 'name' in error
}

type UserState = {
  isLoggedIn: boolean
  showEmailVerificationPage: boolean
  userId: string
  userEmail: string
  userPassword: string
  login: (email: string, password: string) => Promise<iResponse>
  logout: () => Promise<iResponse>
  signUp: (userDetails: signupDetails) => Promise<iResponse>
  resetPasswordVerifyEmail: (email: string) => Promise<iResponse>
  resetPassword: (email: string, code: string, newPassword: string) => Promise<iResponse>
  checkAuthStatus: () => Promise<void>
  verifyEmail: (code: string) => Promise<iResponse>
  cancelSignup: () => Promise<void>
  resendSignUp: () => Promise<iResponse>
}

export const useAuthStore = create(
  persist<UserState>((set) => ({
    isLoggedIn: false,
    showEmailVerificationPage: false,
    userEmail: "",
    userPassword: "",
    userId: "",
    login: async (email: string, password: string) => {
      try {
        const user = await signIn({
          username: email,
          password: password
        })

        if (user.isSignedIn) {
          set({ isLoggedIn: true, showEmailVerificationPage: false, userEmail: "", userPassword: "", userId: "" })
        }

        return { isSuccess: user.isSignedIn }
      } catch (error) {
        set({ isLoggedIn: false })
        console.log("error signing in: ", error)
        return { isSuccess: false, info: error }
      }
    },
    logout: async () => {
      try {
        const user = await signOut()
        set({ isLoggedIn: false })
        return { isSuccess: true }
      } catch (error) {
        console.log("error signing out: ", error)
        return { isSuccess: false, info: error }
      }
    },
    signUp: async (userDetails: signupDetails) => {
      try {
        const user = await signUp({
          username: userDetails.email.toLowerCase(),
          password: userDetails.password,
          options: {
            userAttributes: {
              nickname: userDetails.username,
              name: userDetails.fullname,
              birthdate: userDetails.birthdate,
            }
          }
        })

        if (!user.isSignUpComplete) {
          // verify email
          set({ showEmailVerificationPage: true, userEmail: userDetails.email.toLowerCase(), userPassword: userDetails.password, userId: user.userId ?? "" })
          return { isSuccess: true }
        } else {
          const { login } = useAuthStore.getState()
          login(userDetails.email, userDetails.password)
          return { isSuccess: true }
        }

      } catch (error) {
        console.log("sign up error: ", error)
        return { isSuccess: false, info: error }
      }
    },
    cancelSignup: async () => {
      set({ showEmailVerificationPage: false, userEmail: "", userPassword: "", userId: "" })
    },
    checkAuthStatus: async () => {
      try {
        const user = await getCurrentUser()
        if (user.username.length > 0) {
          set({ isLoggedIn: true })
        } else {
          set({ isLoggedIn: false })
        }
      } catch {
        set({ isLoggedIn: false })
      }
    },
    verifyEmail: async (code: string) => {
      const { userEmail, userPassword, login } = useAuthStore.getState()
      try {
        const user = await confirmSignUp({
          username: userEmail,
          confirmationCode: code
        })

        if (user.isSignUpComplete) {
          login(userEmail, userPassword)
        }

        return { isSuccess: true }
      } catch (error) {
        console.log(error)
        return { isSuccess: false, info: error }
      }
    },
    resendSignUp: async () => {
      const { userEmail } = useAuthStore.getState()
      try {
        await resendSignUpCode({
          username: userEmail
        })

        { return { isSuccess: true } }
      } catch (error) {
        set({ userEmail: "", userPassword: "", userId: "", showEmailVerificationPage: false })
        console.log("Failed to resend confirmation code: ", error)
        return { isSuccess: false, info: error }
      }
    },
    resetPasswordVerifyEmail: async (email: string) => {
      try {
        await resetPassword({
          username: email
        })
        return { isSuccess: true, info: "" }
      } catch (error) {
        console.log("reset password error: ", error)
        return { isSuccess: false, info: error }
      }
    },
    resetPassword: async (email: string, code: string, newPassword: string) => {
      try {
        await confirmResetPassword({
          confirmationCode: code,
          username: email.toLowerCase(),
          newPassword: newPassword
        })
        return { isSuccess: true }
      } catch (error) {
        console.log("reset password error: ", error)
        return { isSuccess: false, info: error }
      }
    },
  }), {
    name: "auth-store",
    storage: createJSONStorage(() => ({
      setItem,
      getItem,
      removeItem: deleteItemAsync
    }))
  })
)

