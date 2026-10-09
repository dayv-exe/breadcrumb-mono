import { useColorScheme } from "react-native";

const DARK_COLORS = [
  "#E53935",
  "#D81B60",
  "#8E24AA",
  "#5E35B1",
  "#3949AB",
  "#1E88E5",
  "#0288D1",
  "#00897B",
  "#43A047",
  "#7CB342",
  "#EF6C00",
  "#F4511E",
]

const LIGHT_COLORS = [
  "#E57373",
  "#F06292",
  "#BA68C8",
  "#9575CD",
  "#7986CB",
  "#64B5F6",
  "#4FC3F7",
  "#4DB6AC",
  "#81C784",
  "#AED581",
  "#FFB74D",
  "#FF8A65",
]

function hashString(str: string) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

export function useUserColor(userId: string): string {
  const isDark = useColorScheme() === "dark"
  const i = hashString(userId) % LIGHT_COLORS.length
  return isDark ? DARK_COLORS[i] : LIGHT_COLORS[i]
}