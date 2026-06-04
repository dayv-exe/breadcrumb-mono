import { NicknameAvailableResponse } from "@/api/searchApi";
import { inputMode } from "@/constants/customInputModeTypes";
import { validateUsername } from "@/constants/regexes";
import { debounce } from "@/utils/debounce";
import { useMemo, useState } from "react";
import { useNicknameAvailable, useNicknameAvailableFn } from "./queries/useNicknameAvailable";

export function useCheckUsername(initUsername?: string, emptyUsernameLabelText?: string) {
  const [username, setUsername] = useState(initUsername ?? "");
  const [debouncedUname, setDebouncedUname] = useState("");

  const debounceInput = useMemo(
    () =>
      debounce((value: string) => {
        setDebouncedUname(value);
      }, 500),
    []
  );

  const {
    data,
    isPending,
    isError,
    error,
  } = useNicknameAvailable(debouncedUname);

  const { mutate: checkUsernameAvailability } = useNicknameAvailableFn();

  const handleChange = (value: string) => {
    setUsername(value);
    debounceInput(value);
  };

  const handleFinalCheck = (onSuccess: (valid: NicknameAvailableResponse) => void) => {
    checkUsernameAvailability(username, {
      onSuccess: (res) => {
        onSuccess(res);
      },
    });
  };

  const getInfoText = (): string => {
    const validateUsernameResult = validateUsername(username)
    if (username.length < 1) {
      return emptyUsernameLabelText ?? "you can change this later";
    } else if (!validateUsernameResult.isValid) {
      return `🚫 ${validateUsernameResult.reason}`
    } else if (isPending || username !== debouncedUname) {
      return "🔎 checking...";
    } else if (data) {
      if (data === "true") {
        return `✅ ${username} is available`;
      } else if (data === "false") {
        return `🚫 ${username} is already in use`
      } else {
        return `📖 That username is not allowed`
      }
    } else if (isError) {
      return `🚫 ${error}`
    } else {
      return `🚫 Nope`
    }
  };

  const getInputMode = (): inputMode => {
    const isValid = validateUsername(username).isValid
    if (username.length < 1 || ((isPending || data === "true") && isValid)) {
      return "normal";
    }
    return "warn";
  };

  return {
    username,
    setUsername: handleChange,
    getInfoText,
    getInputMode,
    handleFinalCheck,
    isValid: data ?? false,
  };
}
