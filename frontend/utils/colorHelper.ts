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
