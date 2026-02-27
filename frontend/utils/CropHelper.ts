// this file will not help your crops grow

export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export const maxPanForScale = (scale: number) => (scale <= 1 ? 0 : (scale - 1) / scale);

// Convert normalized pan to pixel translate for rendering.
// translatePx = panNorm * (containerDim * scale / 2)
export const panNormToTranslatePx = (panNorm: number, containerDim: number, scale: number) =>
  panNorm * (containerDim * scale) / 2;

// Convert pixel translate (from gestures) to normalized pan for saving.
// panNorm = translatePx / (containerDim * scale / 2)
export const translatePxToPanNorm = (translatePx: number, containerDim: number, scale: number) =>
  (2 * translatePx) / (containerDim * scale);