'use client';

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BrandMark } from '@/components/BrandMark';
import { Skeleton } from '@/components/Skeleton';
import {
  MONTHS,
  PERSPECTIVE_COLOR,
  currentMonthValue,
  monthLabel,
  type Perspective,
} from '@/lib/kpi';

type GoalKpi = {
  id: number;
  sl: number;
  perspective: Perspective;
  name: string;
  weight_pct: string;
  direction: 'higher_better' | 'lower_better';
  uom: string;
  target_value: string | null;
  is_locked: boolean | null;
  locked_by_enroll: string | null;
  locked_at: string | null;
};

export function GoalsClient({ enrollNumber }: { enrollNumber: string }) {
  const [month, setMonth] = useState(currentMonthValue);
  const [kpis, setKpis] = useState<GoalKpi[]>([]);
  const [draft, setDraft] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    const res = await fetch(`/api/dashboard/goals?month=${month}`);
    const data = await res.json();
    setKpis(data.kpis ?? []);
    const nextDraft: Record<number, string> = {};
    for (const k of data.kpis ?? []) {
      nextDraft[k.id] = k.target_value ?? '';
    }
    setDraft(nextDraft);
    setLoading(false);
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  const grouped = useMemo(() => {
    const groups: { perspective: string; kpis: GoalKpi[] }[] = [];
    for (const k of kpis) {
      const last = groups[groups.length - 1];
      if (last && last.perspective === k.perspective) {
        last.kpis.push(k);
      } else {
        groups.push({ perspective: k.perspective, kpis: [k] });
      }
    }
    return groups;
  }, [kpis]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const payload = {
      month,
      goals: Object.entries(draft)
        .filter(([, v]) => v !== '')
        .map(([kpiId, targetValue]) => ({ kpiId: Number(kpiId), targetValue })),
    };
    const res = await fetch('/api/dashboard/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setMessage(data.error ?? 'Could not save goals.');
      return;
    }
    setMessage('Overall KPI goals saved and locked for the cluster.');
    load();
  }

  return (
    <main className="min-h-screen bg-bg px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/dashboard/home"
            className="text-sm text-muted transition-colors hover:text-gold"
          >
            ← Back to dashboard
          </Link>
          <span className="font-mono text-xs text-muted">
            Enroll {enrollNumber}
          </span>
        </div>

        <div className="mb-8 flex flex-col items-start gap-6 border-b border-line pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <BrandMark />
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold">
                Cluster admin
              </p>
              <h1 className="font-display text-2xl uppercase tracking-wide text-ink">
                Overall KPI Goals
              </h1>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <span className="font-medium text-ink">Period</span>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-ink outline-none focus:border-gold"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="mb-6 text-sm text-muted">
          Set the cluster-wide target — the &ldquo;Overall KPI Goal&rdquo;
          &mdash; for each KPI this month. This is a reference benchmark
          alongside the figures respondents enter directly on the Dashboard,
          and it does not block or prefill KPI entry.
        </p>

        {message && (
          <div className="mb-6 rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-ink">
            {message}
          </div>
        )}

        <div className="rounded-lg border border-line bg-surface-2 p-6">
          {loading ? (
            <div className="space-y-2.5">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-full" />
              ))}
            </div>
          ) : (
            <form onSubmit={handleSave}>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                      <th className="py-2 pr-3 font-medium">KPI</th>
                      <th className="py-2 pr-3 font-medium">Weight</th>
                      <th className="py-2 pr-3 font-medium">Direction</th>
                      <th className="py-2 pr-3 font-medium">UOM</th>
                      <th className="py-2 pr-3 font-medium">Overall goal</th>
                      <th className="py-2 pl-3 text-right font-medium">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {grouped.map((group) => (
                      <Fragment key={group.perspective}>
                        <tr>
                          <td
                            colSpan={6}
                            className="pb-1 pt-4 text-xs font-semibold uppercase tracking-wide"
                            style={{
                              color:
                                PERSPECTIVE_COLOR[group.perspective as Perspective],
                            }}
                          >
                            {group.perspective}
                          </td>
                        </tr>
                        {group.kpis.map((k) => (
                          <tr key={k.id} className="border-b border-line-soft">
                            <td className="py-2 pr-3 text-ink">{k.name}</td>
                            <td className="py-2 pr-3 font-mono text-muted">
                              {Number(k.weight_pct)}%
                            </td>
                            <td className="py-2 pr-3 text-muted">
                              {k.direction === 'higher_better'
                                ? 'Higher better'
                                : 'Lower better'}
                            </td>
                            <td className="py-2 pr-3 text-muted">{k.uom}</td>
                            <td className="py-2 pr-3">
                              <input
                                type="number"
                                step="any"
                                min="0"
                                value={draft[k.id] ?? ''}
                                onChange={(e) =>
                                  setDraft((d) => ({
                                    ...d,
                                    [k.id]: e.target.value,
                                  }))
                                }
                                onWheel={(e) => e.currentTarget.blur()}
                                className="w-28 rounded-lg border border-line bg-surface px-2 py-1.5 font-mono text-ink outline-none focus:border-gold"
                                placeholder="—"
                              />
                            </td>
                            <td className="py-2 pl-3 text-right">
                              {k.is_locked ? (
                                <span className="inline-flex items-center rounded-full bg-status-good-bg px-2.5 py-1 text-xs font-medium text-status-good">
                                  Locked
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-surface-3 px-2.5 py-1 text-xs font-medium text-muted">
                                  Not set
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="mt-6 rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-[color:var(--color-on-gold)] transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save & lock overall goals'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
