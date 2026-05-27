import { inputMode } from "@/constants/customInputModeTypes";
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
    error,
  } = useNicknameAvailable(debouncedUname);

  const { mutate: checkUsernameAvailability } = useNicknameAvailableFn();

  const handleChange = (value: string) => {
    setUsername(value);
    debounceInput(value);
  };

  const handleFinalCheck = (onSuccess: (valid: boolean) => void) => {
    checkUsernameAvailability(username, {
      onSuccess: (res) => {
        onSuccess(res);
      },
    });
  };

  const getInfoText = (): string => {
    if (username.length < 1) {
      return emptyUsernameLabelText ?? "you can change this later";
    } else if (isPending) {
      return "🔎 checking...";
    } else if (data) {
      return `✅ ${username} is available`;
    } else {
      if (error) return `❌ ${error}`;
      return `🚫 ${error}`;
    }
  };

  const getInputMode = (): inputMode => {
    if (username.length < 1 || isPending || data) {
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
