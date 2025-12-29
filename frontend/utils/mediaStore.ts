import { MediaData } from "@/constants/media"
import { create } from "zustand"

type mediaState = {
  mediaPreview: MediaData | null
  isRecording: boolean

  setMediaPreview: (media: MediaData | null) => void
  discardMediaPreview: () => void
  setIsRecording: (s: boolean) => void
}

export const useMediaStore = create<mediaState>(set => ({
  mediaPreview: null,
  isRecording: false,

  setMediaPreview: media => set({ mediaPreview: media }),
  discardMediaPreview: () => set({ mediaPreview: null }),
  setIsRecording: isRec => set({ isRecording: isRec })
}))