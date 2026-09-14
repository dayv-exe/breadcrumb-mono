import { unsubscribeFromCurrentDbFile } from "@/api/db/InitDb"
import { signupDetails } from "@/api/models/userDetails"
import { useAuthStore } from "@/utils/authStore"
import { confirmResetPassword, confirmSignUp, deleteUser, fetchAuthSession, getCurrentUser, resendSignUpCode, resetPassword, signIn, SignInOutput, signOut, signUp } from "@aws-amplify/auth"
import { useQueryClient } from "@tanstack/react-query"

interface iResponse { isSuccess: boolean, info?: any }
interface iCreateUserResponse { isSuccess: boolean, sub?: string, info?: any, loginFn: () => Promise<void> }

interface state {
  checkAuthStatus: () => Promise<void>
  signup: (userDetails: signupDetails) => Promise<iResponse>
  cancelSignup: () => Promise<void>
  resendSignUp: () => Promise<iResponse>
  verifyEmail: (code: string) => Promise<iCreateUserResponse>
  login: (email: string, password: string, userDetails: SignInOutput | null) => Promise<iResponse>
  logout: () => Promise<iResponse>
  resetUserPassword: (email: string, code: string, newPassword: string) => Promise<iResponse>
  resetPasswordVerifyEmail: (email: string) => Promise<iResponse>
  deleteAccount: () => Promise<iResponse>
  softGetUserid: () => Promise<string>
}

export function useUserManagement(): state {
  const qc = useQueryClient()

  function clearUserAuthState() {
    useAuthStore.setState({
      showEmailVerificationPage: false,
      email: "",
      fullname: "",
      nickname: "",
      password: "",
      userid: "",
      isLoggedIn: false,
    })
  }

  function resetLocalCaches() {
    unsubscribeFromCurrentDbFile()
    qc.invalidateQueries()
  }

  async function login(email: string, password: string, userDetails: SignInOutput | null): Promise<iResponse> {
    let user = userDetails
    try {
      if (!user) {
        user = await signIn({
          username: email,
          password: password
        })
      }

      const { userId } = await getCurrentUser()

      if (user.isSignedIn) {
        useAuthStore.setState({
          email: "",
          fullname: "",
          isLoggedIn: true,
          nickname: "",
          password: "",
          showEmailVerificationPage: false,
          userid: userId
        })
      }

      resetLocalCaches()
      return { isSuccess: user.isSignedIn }
    } catch (error) {
      useAuthStore.setState({ isLoggedIn: false })
      console.log("error signing in: ", error)
      return { isSuccess: false, info: error }
    }
  }

  async function checkAuthStatus() {
    try {
      resetLocalCaches()
      const session = await fetchAuthSession()
      useAuthStore.setState({
        isLoggedIn: !!session.userSub,
        userid: session.userSub,
      })
    } catch (error) {
      console.error("Failed to fetch auth session. Reason: ", error)
    }
  }

  async function signup(details: signupDetails): Promise<iResponse> {
    const handleNoUserid = () => {
      throw new Error("Unable to get userid from signup!")
    }

    try {
      const response = await signUp({
        username: details.email.toLowerCase(),
        password: details.password,
        options: {
          userAttributes: {
            birthdate: details.birthdate,
          }
        }
      })

      if (!response.userId) handleNoUserid()
      if (!response.isSignUpComplete) {
        useAuthStore.setState({
          showEmailVerificationPage: true,
          email: details.email,
          fullname: details.fullname,
          nickname: details.username,
          password: details.password,
          userid: response.userId,
          isLoggedIn: false,
        })
      } else {
        const response = login(details.email, details.password, null)
        return response
      }

      resetLocalCaches()
      return { isSuccess: true, }
    } catch (error) {
      console.error("failed to signup: ", error)
      return { isSuccess: false, info: error }
    }
  }

  async function cancelSignup() {
    await signOut()
    clearUserAuthState()
  }

  async function resendSignUp(): Promise<iResponse> {
    const email = useAuthStore.getState().email
    try {
      await resendSignUpCode({
        username: email
      })

      { return { isSuccess: true } }
    } catch (error) {
      clearUserAuthState()
      console.log("Failed to resend confirmation code: ", error)
      return { isSuccess: false, info: error }
    }
  }

  async function verifyEmail(code: string): Promise<iCreateUserResponse> {
    const { email, password } = useAuthStore.getState()
    try {
      const user = await confirmSignUp({
        username: email,
        confirmationCode: code
      })

      let userSignin = null
      if (user.isSignUpComplete) {
        userSignin = await signIn({
          username: email,
          password: password
        })
      }

      const userid = (await getCurrentUser()).userId

      return {
        isSuccess: user.isSignUpComplete,
        sub: userid,
        loginFn: async () => {
          await login(email, password, userSignin ?? null)
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
  }

  async function logout(): Promise<iResponse> {
    try {
      await signOut()
      resetLocalCaches()
      return { isSuccess: true }
    } catch (error) {
      console.log("error signing out: ", error)
      return { isSuccess: false, info: error }
    }
  }

  async function resetUserPassword(email: string, code: string, newPassword: string): Promise<iResponse> {
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
  }

  async function resetPasswordVerifyEmail(email: string): Promise<iResponse> {
    try {
      await resetPassword({
        username: email
      })
      return { isSuccess: true, info: "" }
    } catch (error) {
      console.log("reset password error: ", error)
      return { isSuccess: false, info: error }
    }
  }

  async function deleteAccount(): Promise<iResponse> {
    try {
      await deleteUser()
      clearUserAuthState()
      resetLocalCaches()
      return { isSuccess: true, }
    } catch (error) {
      return { isSuccess: false, info: error }
    }
  }
  async function softGetUserid() {
    try {
      const { userId } = await getCurrentUser()
      return userId
    } catch (error) {
      console.error("failed to soft get user id: ", error)
      return ""
    }
  }

  return {
    cancelSignup,
    checkAuthStatus,
    deleteAccount,
    login,
    logout,
    resendSignUp,
    resetPasswordVerifyEmail,
    resetUserPassword,
    signup,
    verifyEmail,
    softGetUserid,
  }
}