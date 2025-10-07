import AsyncStorage from "@react-native-async-storage/async-storage"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

type user = {
  userid: string
  nickname: string
  name?: string
}

type HistoryState = {
  searchHistory: user[]
  getSearchHistory: () => user[]
  addSearch: (user: {userid: string, nickname: string, name?:string}) => void
  clearHistory: () => void
}

export const useSearchHistory = create(
  persist<HistoryState>(
    (set, get) => ({
      searchHistory: [],
      getSearchHistory: () => get().searchHistory,
      addSearch: (user) =>
        set((state) => {
          const filtered = state.searchHistory.filter((item) => item.userid !== user.userid)
          const s = [user, ...filtered].slice(0, 5)
          return { searchHistory: s }
        }),
      clearHistory: () => set({ searchHistory: [] }),
    }),
    {
      name: "history-store",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
