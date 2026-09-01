import { FRIENDSHIP_STATUS } from "@/constants/appConstants"

export type signupDetails = {
  username: string
  fullname?: string
  birthdate: string
  email: string
  password: string
}

export type loginDetails = {
  email: string
  password: string
}

export interface UserDetails {
  type: string | null
  bio: string | null;
  birthdate: string | null;
  birthdateChangeCount: number | null;
  dateJoined: string | null;
  defaultPicColors: string | null;
  dpUrl: string | null;
  email: string | null;
  forceChangeNickname: boolean | null;
  isDeactivated: boolean | null;
  isSuspended: boolean | null;
  allowEmailChange: boolean | null;
  lastLogin: string | null;
  allowNicknameChange: boolean | null;
  allowNameChange: boolean | null;
  name: string | null;
  nickname: string | null;
  suspensionReason: string | null;
  userId: string;
  friends: FRIENDSHIP_STATUS | null;
  currentUser: boolean | null
}