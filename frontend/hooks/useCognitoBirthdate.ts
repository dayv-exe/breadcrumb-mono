import { updateUserAttributes } from "aws-amplify/auth";
import { useState } from "react";

export function useChangeBirthdate() {
  const [pending, setPending] = useState(false)

  function cleanErrMsg(err: string): string {
    return "something went wrong"
  }

  async function updateBirthdate(newBirthdate: string) {
    setPending(true)
    try {
      await updateUserAttributes({
        userAttributes: {
          birthdate: newBirthdate
        }
      })

      return { success: true, error: null }
    } catch (err) {
      return { success: false, error: cleanErrMsg(String(err)) }
    } finally {
      setPending(false)
    }
  }

  return {
    updateBirthdate,
    pending
  }
}