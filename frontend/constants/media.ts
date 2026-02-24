export type MediaType = "photo" | "video" | "audio" | "text" | null;

// --- Edit Overlay Types ---

export type OverlayType = "text" | "sticker" | "drawing";

export type OverlayTransform = {
  x: number;
  y: number;
  scale: number;
  rotation: number;
};

export type TextOverlay = {
  id: string;
  type: "text";
  text: string;
  fontSize: number;
  color: string;
  fontWeight: "normal" | "bold";
  transform: OverlayTransform;
};

export type StickerOverlay = {
  id: string;
  type: "sticker";
  emoji: string; // emoji character or image URI
  size: number;
  transform: OverlayTransform;
};

export type DrawingPath = {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  strokeWidth: number;
};

export type DrawingOverlay = {
  id: string;
  type: "drawing";
  paths: DrawingPath[];
};

export type EditOverlay = TextOverlay | StickerOverlay | DrawingOverlay;

// --- Media Data ---

export type MediaData = {
  uri: string;
  type: MediaType;
  duration?: number;
  thumbnail?: string;
  width?: number;
  height?: number;
  fileName?: string;
  fileSize?: number;
  resizeMode: "cover" | "contain";
  text?: string
  overlays?: EditOverlay[];
};

export const createDefaultTextOverlay = (defaultText: string, x: number, y: number): TextOverlay => ({
  id: `${Date.now()}-${Math.random()}`,
  type: "text",
  text: defaultText,
  fontSize: 32,
  color: "#FFFFFF",
  fontWeight: "bold",
  transform: {
    x: 0,
    y: y,
    scale: 1,
    rotation: 0,
  },
});

export type FontStyle = "normal" | "italic";
export type FontWeight =
  | "normal"
  | "bold"
  | "100"
  | "200"
  | "300"
  | "400"
  | "500"
  | "600"
  | "700"
  | "800"
  | "900";

export interface EditorState {
  text: string;
  bgColor: string;
  textColor: string;
  fontSize: number;
  fontStyle: FontStyle;
  fontWeight: FontWeight;
}

export type ColorPickerTarget = "bg" | "text" | null;