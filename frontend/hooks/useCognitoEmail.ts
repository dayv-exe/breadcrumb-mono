import AsyncStorage from "@react-native-async-storage/async-storage";
import { confirmUserAttribute, fetchUserAttributes, sendUserAttributeVerificationCode, updateUserAttributes } from "aws-amplify/auth";
import { useEffect, useState } from "react";

const CODE_SENT_KEY = "codeSentAt";

export function useDelayCodeResend() {
  const [codeSentAt, setCodeSentAt] = useState<number | null>(null)

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(CODE_SENT_KEY);
      if (saved) {
        setCodeSentAt(parseInt(saved, 10))
      }
    })();
  }, []);

  async function updateCodeSentTime() {
    setCodeSentAt(Date.now())
    await AsyncStorage.setItem(CODE_SENT_KEY, codeSentAt?.toString() ?? "");
  }

  function canResend(timeInMins: number = 5): boolean {
    if (!codeSentAt) return true; // never sent yet
    const now = Date.now();
    const interval = timeInMins * 60 * 1000;
    return now - codeSentAt > interval;
  }

  return {
    updateCodeSentTime,
    canResend
  }
}

export function useRequestEmailUpdate() {
  const [pending, setPending] = useState(false)

  function cleanErrorMessage(error: string): string {
    if (error.startsWith("AliasExistsException")) {
      return "😬 this email is already in use by another user!"
    } else if (error.startsWith("CodeMismatchException")) {
      return "😬 incorrect verification code"
    } else if (error.startsWith("ExpiredCodeException")) {
      return "😬 expired verification code, resend new a one"
    } else if (error.startsWith("TooManyRequestsException")) {
      return "🥱 you have made too many requests, please try again later"
    } else {
      return "🤔 something went wrong please try again"
    }
  }

  async function requestEmailUpdate(newEmail: string) {
    setPending(true)
    try {
      await updateUserAttributes({
        userAttributes: {
          email: newEmail
        }
      })

      return { success: true, error: null }
    } catch (err: any) {
      return { success: false, error: cleanErrorMessage(String(err)) }
    } finally {
      setPending(false)
    }
  }

  return {
    requestEmailUpdate,
    pending
  }
}

export function useResendEmailChangeCode() {
  const [pending, setPending] = useState(false)

  const { canResend, updateCodeSentTime } = useDelayCodeResend()

  function cleanErrorMessage(error: string): string {
    if (error.startsWith("LimitExceededException") || error.startsWith("TooManyRequestsException")) {
      return "Too many attempts, try again later."
    } else {
      return "Something went wrong, try again"
    }
  }

  async function resendEmailChangeCode() {
    setPending(true)

    if (!canResend(2)) {
      return { success: false, error: "too soon, try again." }
    }

    updateCodeSentTime()
    try {
      await sendUserAttributeVerificationCode({
        userAttributeKey: "email"
      })
      return { success: true, error: null }
    } catch (err: any) {
      return { success: false, error: cleanErrorMessage(String(err)) }
    } finally {
      setPending(false)
    }
  }

  return {
    resendEmailChangeCode,
    pending
  }
}

export function useCompleteEmailChange() {
  const [pending, setPending] = useState(false)

  function cleanErrorMessage(error: string): string {
    if (error.startsWith("AliasExistsException")) {
      return "😬 this email is already in use by another user!"
    } else if (error.startsWith("CodeMismatchException")) {
      return "😬 incorrect verification code"
    } else if (error.startsWith("ExpiredCodeException")) {
      return "😬 expired verification code, resend new a one"
    } else if (error.startsWith("TooManyRequestsException")) {
      return "🥱 you have made too many requests, please try again later"
    } else {
      return "🤔 something went wrong please try again"
    }
  }

  async function completeEmailChange(code: string) {
    setPending(true)

    try {
      await confirmUserAttribute({
        confirmationCode: code,
        userAttributeKey: "email"
      })
      return { success: true, error: null }
    } catch (err: any) {
      return { success: false, error: cleanErrorMessage(String(err)) }
    } finally {
      setPending(false)
    }
  }

  return {
    completeEmailChange,
    pending
  }
}

export function useEmailVerificationStatus() {
  const [pending, setPending] = useState(false)

  async function emailVerificationStatus() {
    setPending(true)

    try {
      const status = await fetchUserAttributes()
      return { success: true, verified: status.email_verified, error: null }
    } catch (err: any) {
      return { success: false, verified: false, error: String("Something went wrong, try again.") }
    } finally {
      setPending(false)
    }
  }

  return {
    emailVerificationStatus,
    pending
  }
}