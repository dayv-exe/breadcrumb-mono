import { signupDetails } from "@/api/models/userDetails"
import { confirmResetPassword, confirmSignUp, deleteUser, getCurrentUser, resendSignUpCode, resetPassword, signIn, SignInOutput, signOut, signUp } from "aws-amplify/auth"
import { deleteItemAsync, getItem, setItem } from "expo-secure-store"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

interface iResponse { isSuccess: boolean, info?: any }
interface iCreateUserResponse { isSuccess: boolean, sub?: string, info?: any, loginFn: () => Promise<void> }

type UserState = {
  isLoggedIn: boolean
  showEmailVerificationPage: boolean
  userId: string
  userEmail: string
  userPassword: string
  userFullname: string | null
  userNickname: string | null
  userDpUrl: string | null
  login: (email: string, password: string, userDetails: SignInOutput | null) => Promise<iResponse>
  logout: () => Promise<iResponse>
  signUp: (userDetails: signupDetails) => Promise<iResponse>
  deleteUser: () => Promise<iResponse>
  resetPasswordVerifyEmail: (email: string) => Promise<iResponse>
  resetPassword: (email: string, code: string, newPassword: string) => Promise<iResponse>
  checkAuthStatus: () => Promise<void>
  verifyEmail: (code: string) => Promise<iCreateUserResponse>
  cancelSignup: () => Promise<void>
  resendSignUp: () => Promise<iResponse>
  clearUserDetails: () => Promise<void>
  setUserDetails: (nickname: string | null, fullname: string | null, dpUrl: string | null) => void
}

export const useAuthStore = create(
  persist<UserState>((set, get) => ({
    isLoggedIn: false,
    showEmailVerificationPage: false,
    userEmail: "",
    userPassword: "",
    userId: "",
    userFullname: "",
    userNickname: "",
    userDpUrl: "",
    clearUserDetails: async () => {
      set({ isLoggedIn: true, showEmailVerificationPage: false, userEmail: "", userPassword: "", userNickname: "", userFullname: "" })
    },
    login: async (email: string, password: string, userDetails: SignInOutput | null): Promise<iResponse> => {
      try {
        const user = userDetails ? userDetails : await signIn({
          username: email,
          password: password
        })

        const { userId } = await getCurrentUser()

        if (user.isSignedIn) {
          set({ isLoggedIn: true, showEmailVerificationPage: false, userEmail: "", userPassword: "", userNickname: "", userFullname: "", userId: userId })
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
        await signOut()
        set({ isLoggedIn: false, userId: "" })
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
              birthdate: userDetails.birthdate,
            }
          }
        })

        if (!user.userId) throw new Error("Failed to get userid from signup!")

        if (!user.isSignUpComplete) {
          // verify email
          set({ showEmailVerificationPage: true, userEmail: userDetails.email.toLowerCase(), userPassword: userDetails.password, userId: user.userId, userFullname: userDetails.fullname, userNickname: userDetails.username })
          return { isSuccess: true }
        } else {
          const response = await get().login(userDetails.email, userDetails.password, null)
          return response
        }

      } catch (error) {
        console.log("sign up error: ", error)
        return { isSuccess: false, info: error }
      }
    },
    cancelSignup: async () => {
      await signOut()
      set({ showEmailVerificationPage: false, userEmail: "", userPassword: "", userFullname: "", userNickname: "" })
    },
    deleteUser: async () => {
      try {
        await deleteUser()
        return { isSuccess: true, }
      } catch (error) {
        return { isSuccess: false, info: error }
      }
    },
    checkAuthStatus: async () => {
      try {
        const user = await getCurrentUser()
        if (user.username.length > 0) {
          set({ isLoggedIn: true, userId: user.userId })
        } else {
          set({ isLoggedIn: false, userId: "" })
        }
      } catch {
        set({ isLoggedIn: false, userId: "" })
      }
    },
    verifyEmail: async (code: string) => {
      const { userEmail, userPassword } = get()
      try {
        const user = await confirmSignUp({
          username: userEmail,
          confirmationCode: code
        })

        let userSignin = null
        if (user.isSignUpComplete) {
          userSignin = await signIn({
            username: userEmail,
            password: userPassword
          })
        }

        const userId = (await getCurrentUser()).userId

        return {
          isSuccess: user.isSignUpComplete,
          sub: userId,
          loginFn: async () => {
            await get().login(userEmail, userPassword, userSignin ?? null)
          },
        }
      } catch (error) {
        console.log(error)
        return {
          isSuccess: false,
          info: error,
          loginFn: async () => {
            console.error("verify email failed, cannot login")
          }
        }
      }
    },
    resendSignUp: async () => {
      const { userEmail } = get()
      try {
        await resendSignUpCode({
          username: userEmail
        })

        { return { isSuccess: true } }
      } catch (error) {
        set({ userEmail: "", userPassword: "", showEmailVerificationPage: false, userFullname: "", userNickname: "" })
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

    setUserDetails: async (nickname: string | null, fullname: string | null, dpUrl: string | null) => {
      set({ userNickname: nickname, userFullname: fullname, userDpUrl: dpUrl })
    }
  }), {
    name: "auth-store",
    storage: createJSONStorage(() => ({
      setItem,
      getItem,
      removeItem: deleteItemAsync
    }))
  })
)

