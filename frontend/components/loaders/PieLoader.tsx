import { useThemeColor } from '@/hooks/useThemeColor';
import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

export default function PieLoader({
  percentage = 0,
  size = 120,
  trackWidth = 5,
  gap = 6,
}) {
  const fillColor = useThemeColor({}, "darkenVibrant")
  const trackColor = useThemeColor({}, "fadedBackground")
  const backgroundColor = useThemeColor({}, "background")
  const pct = Math.max(0, Math.min(100, percentage));
  const c = size / 2;
  const outerR = size / 2;
  const gapR = outerR - trackWidth;       // inner edge of the track ring
  const r = gapR - gap;                    // radius of the fill pie
  const top = c - r;                       // y of the pie's 12 o'clock point
  const angle = (pct / 100) * 360 - 90;
  const rad = (angle * Math.PI) / 180;
  const x = c + r * Math.cos(rad);
  const y = c + r * Math.sin(rad);
  const largeArc = pct > 50 ? 1 : 0;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* track ring */}
      <Circle cx={c} cy={c} r={outerR} fill={trackColor} />
      {/* background circle — carves the gap between track and fill */}
      <Circle cx={c} cy={c} r={gapR} fill={backgroundColor} />
      {/* fill pie */}
      {pct >= 100 ? (
        <Circle cx={c} cy={c} r={r} fill={fillColor} />
      ) : pct > 0 ? (
        <Path d={`M ${c} ${c} L ${c} ${top} A ${r} ${r} 0 ${largeArc} 1 ${x} ${y} Z`} fill={fillColor} />
      ) : null}
    </Svg>
  );
}