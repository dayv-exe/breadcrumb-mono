import { MAX_USERNAME_LEN, MIN_USERNAME_LEN } from "./appConstants";

export const usernameRegex = /^(?!.*[_.].*[_.])(?!.*(_\.|\._))[a-zA-Z0-9][a-zA-Z0-9._]*[a-zA-Z0-9]$/
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const emojiRegex = /\p{Emoji}/u;

export function validateUsername(username: string): {
  isValid: boolean;
  reason: string;
} {

  if (!/^[a-zA-Z0-9]/.test(username)) {
    return { isValid: false, reason: "must start with a letter or number." };
  }

  if (!/[a-zA-Z0-9]$/.test(username)) {
    return { isValid: false, reason: "must end with a letter or number." }
  }

  // Rule 3: Only allow letters, numbers, dot, and underscore
  if (!/^[a-zA-Z0-9._]+$/.test(username)) {
    return { isValid: false, reason: "can only contain letters, numbers, and either one dot (.) or one underscore (_)" }
  }

  // only one occurrence of either dot or underscore
  const dotCount = (username.match(/\./g) || []).length;
  const underscoreCount = (username.match(/_/g) || []).length;

  if (dotCount + underscoreCount > 1) {
    return { isValid: false, reason: "can only contain one dot or one underscore." }
  } else if (dotCount === 1 && underscoreCount === 1) {
    return { isValid: false, reason: "cannot contain both a dot and an underscore." }
  }

  // must contain at least one letter
  if (!/[a-zA-Z]/.test(username)) {
    return {
      isValid: false,
      reason: "must contain at least one letter.",
    };
  }

  if (username.length < MIN_USERNAME_LEN || username.length > MAX_USERNAME_LEN) {
    return { isValid: false, reason: "must be between 3 and 15 characters." }
  }

  // block patterns like a_1, b.2, a_b, c.d (too short with symbol in middle)
  if (/^[a-zA-Z][._][a-zA-Z0-9]$/.test(username)) {
    return {
      isValid: false,
      reason: "too short.",
    };
  }

  return {
    isValid: true,
    reason: "",
  };
}
