import { inputMode } from "@/constants/customInputModeTypes";
import { emailRegex } from "@/constants/regexes";
import { useState } from "react";

export function useCheckEmail(initEmail?: string) {
  const [email, setEmail] = useState(initEmail ?? "")

  const emailValid = emailRegex.test(email)

  const emailInfoText = (emailValid || email.length === 0) ? "🔒 other users won't see this" : "❗️ doesn't look right yet"

  const emailInputMode: inputMode = emailValid || email.length === 0 ? "normal" : "warn"

  return {
    email, 
    setEmail,
    emailValid,
    emailInfoText,
    emailInputMode
  }
}