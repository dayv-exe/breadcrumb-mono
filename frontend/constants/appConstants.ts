import Toast from "react-native-toast-message";

export const SUGGESTED_EMAIL_DOMAINS = ["@gmail.com", "@icloud.com", "@solent.ac.uk"];
export const MAX_AGE = 120;
export const MIN_AGE = 13;
export const MAX_USERNAME_LEN = 15;
export const MIN_USERNAME_LEN = 3;
export const MAX_FULLNAME_LEN = 20;
export const MAX_BIO_CHARS = 50;
export const MAX_RIDICULOUS_AGE = 200;
export const MIN_RIDICULOUS_AGE = -21;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 32;
export const MAX_VIDEO_DURATION_MILLISECONDS = 15000;
export const MAX_AUDIO_DURATION_MILLISECONDS = 30000;
export const MAX_SEARCH_STRING_CHARS = 20;
export const USERNAME_CHANGE_DELAY = 3; //days
export const NAME_CHANGE_DELAY = 3; //days
export const BIRTHDATE_CHANGE_DELAY = 3; //days
export const EMAIL_CHANGE_DELAY = 21; //days
export const TEXT_CRUMB_LIMIT = 150//chars
export const DEFAULT_CRUMB_RADIUS = 25 // meters

export const STATUS_FRIENDS = "true";
export const STATUS_REQUESTED = "requested";
export const STATUS_RECEIVED = "received";
export const STATUS_NOT_FRIENDS = "false";
export enum FRIENDSHIP_STATUS {
  FRIENDS = STATUS_FRIENDS,
  REQUESTED = STATUS_REQUESTED,
  RECEIVED = STATUS_RECEIVED,
  NOT_FRIENDS = STATUS_NOT_FRIENDS,
}

export const MAX_PREVIEW_MEDIA = 5;

export const PRESET_COLORS = [
  "#FFFFFF", "#000000", "#FF3B30", "#FF9500", "#FFCC00",
  "#34C759", "#007AFF", "#5856D6", "#AF52DE", "#FF2D55",
  "#8E8E93", "#F2F2F7", "#1C1C1E", "#2C2C2E", "#48484A",
  "#D1D1D6", "#E5E5EA", "#C7C7CC", "#AEAEB2", "#636366",
];

export const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72];
export const MEDIA_FULL_MESSAGE = `Only ${MAX_PREVIEW_MEDIA} items max allowed at a time!`
export type EmojiCategory = {
  id: string;
  label: string;
  emojis: string[];
};


export enum FRIENDSHIP_ACTIONS {
  REQUEST = "request",
  CANCEL_REQUEST = "cancel-request",
  ACCEPT = "accept",
  REJECT = "reject",
  END = "end",
  GET_FRIENDS = "all",
  GET_REQUESTS = "pending",
}

export function ShowToast(message: string) {
  Toast.show({
    text1: message,
    position: "top",
    type: "info",
  });
}