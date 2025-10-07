import { inputMode } from "@/constants/customInputModeTypes";
import { useUsernameAvailableOnInputChange, useUsernameAvailableOnSubmit } from "@/hooks/queries/useUsernameAvailable";
import { debounce } from "@/utils/debounce";
import { useMemo, useState } from "react";

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
  } = useUsernameAvailableOnInputChange(debouncedUname);

  const { mutate: checkUsernameAvailability } = useUsernameAvailableOnSubmit();

  const handleChange = (value: string) => {
    setUsername(value);
    debounceInput(value);
  };

  const handleFinalCheck = (onSuccess: (valid: boolean) => void) => {
    checkUsernameAvailability(username, {
      onSuccess: (res) => {
        onSuccess(res.isValid);
      },
    });
  };

  const getInfoText = (): string => {
    if (username.length < 1) {
      return emptyUsernameLabelText ?? "you can change this later";
    } else if (isPending) {
      return "🔎 checking...";
    } else if (data?.isValid) {
      return `✅ ${username} is available`;
    } else {
      if (error) return `❌ ${error}`;
      return `🚫 ${data?.reason}`;
    }
  };

  const getInputMode = (): inputMode => {
    if (username.length < 1 || isPending || data?.isValid) {
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
    isValid: data?.isValid ?? false,
  };
}
