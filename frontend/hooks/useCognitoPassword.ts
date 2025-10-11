import { updatePassword } from "aws-amplify/auth";
import { useState } from "react";

export function useChangePassword() {
  const [pending, setPending] = useState(false)

  function cleanErrMsg(err: string): string {
    if (
      err.startsWith("InvalidPasswordException") ||
      err.startsWith("PasswordHistoryPolicyViolationException")
    ) {
      return "Invalid password, try another."
    } else if (
      err.startsWith("LimitExceededException") ||
      err.startsWith("TooManyRequestsException")
    ) {
      return "Too many attempts, try again later."
    } else if (err.startsWith("NotAuthorizedException")) {
      return "Old password is incorrect."
    } else {
      return "Something went wrong"
    }
  }

  async function changePassword(oldPassword: string, newPassword: string) {
    setPending(true)

    try {
      await updatePassword({
        newPassword: newPassword,
        oldPassword: oldPassword
      })

      return { success: true, error: null }
    } catch (err) {
      console.log(err)
      return { success: false, error: cleanErrMsg(String(err)) }
    } finally {
      setPending(false)
    }
  }

  return {
    changePassword,
    pending
  }
}