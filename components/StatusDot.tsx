import { STATUS_COLOR, STATUS_LABEL, statusTier } from '@/lib/kpi';

export function StatusDot({ pct }: { pct: number | null }) {
  const tier = statusTier(pct);
  return (
    <span
      className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
      style={{ backgroundColor: STATUS_COLOR[tier] }}
      title={STATUS_LABEL[tier]}
      aria-hidden="true"
    />
  );
}
