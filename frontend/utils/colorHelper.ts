export const toTransparent = (color: string) => {
  if (typeof color !== 'string') return 'transparent';

  // handle 6-digit hex like "#RRGGBB"
  if (color.startsWith('#') && color.length === 7) {
    return color + '00';
  }

  // handle 8-digit hex (already has alpha)
  if (color.startsWith('#') && color.length === 9) {
    return color.slice(0, 7) + '00';
  }

  // handle color keywords like "white", "black"
  if (color.toLowerCase() === 'white') return 'rgba(255,255,255,0)';
  if (color.toLowerCase() === 'black') return 'rgba(0,0,0,0)';

  // handle rgba strings: turn last number to 0
  if (color.startsWith('rgba')) {
    return color.replace(/rgba\(([^,]+),([^,]+),([^,]+),[^)]+\)/, 'rgba($1,$2,$3,0)');
  }

  // fallback
  return 'transparent';
};

export function withAlpha(color: string, alpha: number) {
  // rgb/rgba
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i)
  if (rgbMatch) {
    const r = Number(rgbMatch[1])
    const g = Number(rgbMatch[2])
    const b = Number(rgbMatch[3])
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  // hex #RGB or #RRGGBB
  let hex = color.replace("#", "").trim()
  if (hex.length === 3) hex = hex.split("").map(c => c + c).join("")
  if (hex.length === 6) {
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  // fallback: if it's something like "white" and we can't parse it
  return `rgba(0,0,0,0)`
}
