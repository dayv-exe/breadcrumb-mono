import { deleteItemAsync, getItem, setItem } from "expo-secure-store"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

type UserState = {
  isLoggedIn: boolean
  showEmailVerificationPage: boolean
  userid: string
  email: string
  password: string
  fullname: string | null
  nickname: string | null
}

export const useAuthStore = create(
  persist<UserState>((set, get) => ({
    isLoggedIn: false,
    showEmailVerificationPage: false,
    email: "",
    password: "",
    userid: "",
    fullname: "",
    nickname: "",
  }), {
    name: "auth-store",
    storage: createJSONStorage(() => ({
      setItem,
      getItem,
      removeItem: deleteItemAsync
    }))
  })
)

