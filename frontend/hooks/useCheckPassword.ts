import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/constants/appConstants";
import { inputMode } from "@/constants/customInputModeTypes";
import { useState } from "react";

export function useCheckPassword() {
  const [password, setPassword] = useState("")

  const passwordValid = password.length >= MIN_PASSWORD_LENGTH && password.length <= MAX_PASSWORD_LENGTH

  const passwordInfoText = password.length === 0 ? "choose a strong password" : passwordValid ? "" : password.length < MIN_PASSWORD_LENGTH ? `❗️ must be at least ${MIN_PASSWORD_LENGTH} characters long` : password.length > MAX_PASSWORD_LENGTH ? `❗️ must be no more than ${MAX_PASSWORD_LENGTH} characters long` : ""

  const passwordInputMode: inputMode = password.length === 0 || passwordValid ? "normal" : "warn"

  return {
    password,
    setPassword,
    passwordValid,
    passwordInfoText,
    passwordInputMode
  }
}