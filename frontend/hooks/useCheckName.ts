import { MAX_FULLNAME_LEN } from "@/constants/appConstants"
import { inputMode } from "@/constants/customInputModeTypes"
import { emojiRegex } from "@/constants/regexes"
import { useState } from "react"

export function useCheckName(initName?: string, emptyNameLabelText?: string, allowEmojis: boolean = true) {
  const [name, setName] = useState(initName ?? "")

  const getNameLabelText = (): string => {
    if (name.length > MAX_FULLNAME_LEN) {
      return `🚫 cannot be greater than ${MAX_FULLNAME_LEN} characters`
    }

    if (!allowEmojis && emojiRegex.test(name)) {
      return `add emojis after completing the signup process`
    }

    return emptyNameLabelText ?? `helps your friends find you`
  }

  const NameValid = (): boolean => {
    if (name.length > MAX_FULLNAME_LEN) {
      return false
    }


    return true
  }

  const getNameInputMode = (): inputMode => {
    return NameValid() ? "normal" : "warn"
  }

  return {
    name,
    setName,
    getNameLabelText,
    NameValid,
    getNameInputMode
  }
}