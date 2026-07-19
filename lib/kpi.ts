export const ROLES = ['Finance', "CEO's Office", 'CEO', 'CBO/SBU'] as const;
export type Role = (typeof ROLES)[number];

export type SbuGroup = 'trading' | 'logistics';

export const SBU_GROUP_LABEL: Record<SbuGroup, string> = {
  trading: 'Trading Cluster',
  logistics: 'Logistics Cluster',
};

// Enroll numbers are always exactly 6 digits, numeric only.
export function isValidEnroll(value: string): boolean {
  return /^\d{6}$/.test(value);
}
export const ENROLL_HINT = 'Enroll number must be exactly 6 digits.';

export const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
].map((label, i) => ({
  value: `2026-${String(i + 1).padStart(2, '0')}`,
  label: `${label}'26`,
}));

export function currentMonthValue() {
  const now = new Date();
  const month = now.getFullYear() === 2026 ? now.getMonth() : 0;
  return `2026-${String(month + 1).padStart(2, '0')}`;
}

export function monthLabel(value: string) {
  return MONTHS.find((m) => m.value === value)?.label ?? value;
}

export function monthToDate(value: string) {
  return `${value}-01`;
}

export function dateToMonthValue(date: string) {
  return date.slice(0, 7);
}

export type Direction = 'higher_better' | 'lower_better';

export function achievementPct(
  actual: number,
  target: number,
  direction: Direction
): number | null {
  if (target <= 0) return null;
  if (direction === 'higher_better') {
    return (actual / target) * 100;
  }
  if (actual <= 0) return null;
  return (target / actual) * 100;
}

export function weightedScore(achievementPercent: number, weightPct: number) {
  return achievementPercent * (weightPct / 100);
}

export type StatusTier = 'good' | 'watch' | 'risk' | 'none';

export function statusTier(pct: number | null): StatusTier {
  if (pct === null || pct === undefined) return 'none';
  if (pct >= 100) return 'good';
  if (pct >= 80) return 'watch';
  return 'risk';
}

export const STATUS_COLOR: Record<StatusTier, string> = {
  good: 'var(--color-status-good)',
  watch: 'var(--color-status-watch)',
  risk: 'var(--color-status-risk)',
  none: 'var(--color-muted-2)',
};

export const STATUS_LABEL: Record<StatusTier, string> = {
  good: 'On target',
  watch: 'Watch',
  risk: 'At risk',
  none: 'Not submitted',
};

export const PERSPECTIVES = [
  'Financial',
  'Customer',
  'Internal Process',
  'Learning & Growth',
] as const;
export type Perspective = (typeof PERSPECTIVES)[number];

export const PERSPECTIVE_COLOR: Record<Perspective, string> = {
  Financial: 'var(--color-persp-financial)',
  Customer: 'var(--color-persp-customer)',
  'Internal Process': 'var(--color-persp-process)',
  'Learning & Growth': 'var(--color-persp-growth)',
};

// Best-effort: turns an evidence value into a clickable href if it looks like
// a URL, without requiring the field to be a strict URL at entry time.
export function evidenceHref(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(trimmed)) return `https://${trimmed}`;
  return null;
}

export function examplePlaceholder(uom: string): string {
  switch (uom) {
    case '%':
      return 'e.g. 90';
    case 'BDT':
      return 'e.g. 1000000';
    case 'Days':
      return 'e.g. 45';
    case 'No.':
      return 'e.g. 3';
    default:
      return 'e.g. 0';
  }
}
