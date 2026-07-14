'use client';

import { useId } from 'react';

const START_DEG = -135;
const SWEEP_DEG = 270;

function toXY(cx: number, cy: number, r: number, deg: number): [number, number] {
  const th = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(th), cy + r * Math.sin(th)];
}

function arcPath(cx: number, cy: number, r: number, a0: number, a1: number) {
  const [x1, y1] = toXY(cx, cy, r, a0);
  const [x2, y2] = toXY(cx, cy, r, a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

// A brass-bezeled instrument dial in the spirit of a ship's engine-room
// telegraph: fixed metal bezel and tick marks, a needle that sweeps to the
// value, and a small digital sub-readout for exact figures.
export function Gauge({
  percent,
  size = 84,
  color = 'var(--color-gold)',
  label,
  max = 150,
}: {
  percent: number | null;
  size?: number;
  color?: string;
  label?: string;
  max?: number;
}) {
  const uid = useId();
  const cx = size / 2;
  const cy = size / 2;
  const bezelR = size / 2 - 1;
  const bezelW = Math.max(3, size * 0.07);
  const faceR = bezelR - bezelW;
  const stroke = Math.max(4, size * 0.075);
  const r = faceR - stroke * 1.4;

  const hasVal = percent !== null && percent !== undefined;
  const v = hasVal ? Math.max(0, Math.min(1, percent / max)) : 0;

  const trackPath = arcPath(cx, cy, r, START_DEG, START_DEG + SWEEP_DEG);
  const valuePath =
    v > 0.004 ? arcPath(cx, cy, r, START_DEG, START_DEG + SWEEP_DEG * v) : '';

  // Ticks every 10% of max, a longer mark every 50%.
  const tickStep = max >= 100 ? max / 15 : max / 10;
  const ticks: { major: boolean; d: string }[] = [];
  for (let t = 0; t <= max + 0.001; t += tickStep) {
    const deg = START_DEG + SWEEP_DEG * (t / max);
    const major = Math.round(t) % 50 === 0;
    const outer = r + stroke / 2 + 1.5;
    const inner = outer - (major ? size * 0.09 : size * 0.045);
    const [x1, y1] = toXY(cx, cy, inner, deg);
    const [x2, y2] = toXY(cx, cy, outer, deg);
    ticks.push({ major, d: `M ${x1} ${y1} L ${x2} ${y2}` });
  }

  const needleDeg = START_DEG + SWEEP_DEG * v;
  const needleLen = r - stroke * 0.9;
  const [tipX, tipY] = toXY(cx, cy, needleLen, needleDeg);
  const [tailX, tailY] = toXY(cx, cy, size * 0.09, needleDeg + 180);
  const perpDeg = needleDeg + 90;
  const baseHalf = Math.max(1.1, size * 0.016);
  const [lx, ly] = toXY(cx, cy, baseHalf, perpDeg);
  const [rx, ry] = toXY(cx, cy, baseHalf, perpDeg + 180);
  const needlePath = `M ${tipX} ${tipY} L ${lx} ${ly} L ${tailX} ${tailY} L ${rx} ${ry} Z`;

  const val = hasVal ? `${Math.round(percent * 10) / 10}` : '—';
  const readoutW = size * 0.62;
  const readoutH = size * 0.16;
  const readoutY = cy + r * 0.46;
  const fontSize = Math.max(8, size * 0.115);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <defs>
          <linearGradient id={`${uid}-bezel`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-bezel-hi)" />
            <stop offset="55%" stopColor="var(--color-gold)" />
            <stop offset="100%" stopColor="var(--color-bezel-lo)" />
          </linearGradient>
          <radialGradient id={`${uid}-hub`} cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="var(--color-bezel-hi)" />
            <stop offset="60%" stopColor="var(--color-gold)" />
            <stop offset="100%" stopColor="var(--color-bezel-lo)" />
          </radialGradient>
        </defs>

        <circle cx={cx} cy={cy} r={bezelR} fill={`url(#${uid}-bezel)`} />
        <circle cx={cx} cy={cy} r={faceR} fill="var(--color-dial-face)" />
        <circle
          cx={cx}
          cy={cy}
          r={faceR - 0.75}
          fill="none"
          stroke="rgba(0,0,0,0.5)"
          strokeWidth={1.5}
        />

        {ticks.map((t, i) => (
          <path
            key={i}
            d={t.d}
            stroke={t.major ? 'var(--color-muted)' : 'var(--color-muted-2)'}
            strokeWidth={t.major ? 1.4 : 1}
            strokeLinecap="round"
          />
        ))}

        <path
          d={trackPath}
          fill="none"
          stroke="var(--color-dial-track)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {valuePath && (
          <path
            d={valuePath}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
        )}

        <rect
          x={cx - readoutW / 2}
          y={readoutY}
          width={readoutW}
          height={readoutH}
          rx={readoutH * 0.2}
          fill="var(--color-surface-3)"
          stroke="var(--color-line)"
          strokeWidth={1}
        />
        <text
          x={cx}
          y={readoutY + readoutH / 2 + 0.5}
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="var(--font-mono)"
          fontSize={fontSize}
          fontWeight={500}
          fill={hasVal ? color : 'var(--color-muted-2)'}
        >
          {val}
        </text>

        <path d={needlePath} fill={color} opacity={hasVal ? 1 : 0.35} />
        <circle cx={cx} cy={cy} r={size * 0.065} fill={`url(#${uid}-hub)`} stroke="rgba(0,0,0,0.4)" strokeWidth={0.75} />
      </svg>
      {label && (
        <div
          className="text-center text-[11px] text-muted"
          style={{ maxWidth: size + 20 }}
        >
          {label}
        </div>
      )}
    </div>
  );
}
