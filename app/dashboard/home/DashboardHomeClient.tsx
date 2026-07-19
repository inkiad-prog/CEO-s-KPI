'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { BrandMark } from '@/components/BrandMark';
import { Gauge } from '@/components/Gauge';
import { Skeleton } from '@/components/Skeleton';
import { StatusDot } from '@/components/StatusDot';
import {
  MONTHS,
  PERSPECTIVE_COLOR,
  currentMonthValue,
  monthLabel,
  type Perspective,
} from '@/lib/kpi';
import { downloadExcel, type Cell } from '@/lib/exportExcel';

type KpiTableRow = {
  kpiId: number;
  sl: number;
  perspective: Perspective;
  name: string;
  weightPct: number;
  uom: string;
  target: number | null;
  achievement: number | null;
  achievementPct: number | null;
  weightedScore: number;
  enteredByEnroll: string | null;
  enteredAt: string | null;
};

type PerspectiveStatus = {
  perspective: Perspective;
  submitted: boolean;
  submittedByEnroll: string | null;
  submittedAt: string | null;
};

type RollupResponse = {
  month: string;
  kpiTable: KpiTableRow[];
  kpiTotals: { weightedScoreSum: number; entriesComplete: number; totalKpis: number };
  perspectives: { perspective: Perspective; achievementPct: number }[];
  perspectiveStatus: PerspectiveStatus[];
  completion: { perspectivesComplete: number; totalPerspectives: number; allComplete: boolean };
  finalized: { finalized_by_enroll: string; finalized_at: string } | null;
};

export function DashboardHomeClient({
  enrollNumber,
}: {
  enrollNumber: string;
}) {
  const [month, setMonth] = useState(currentMonthValue);
  const [rollup, setRollup] = useState<RollupResponse | null>(null);
  const [loadingRollup, setLoadingRollup] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadRollup = useCallback(async () => {
    setLoadingRollup(true);
    const res = await fetch(`/api/dashboard/rollup-simple?month=${month}`);
    const data = await res.json();
    setRollup(data);
    setLoadingRollup(false);
  }, [month]);

  useEffect(() => {
    setMessage(null);
    loadRollup();
  }, [loadRollup]);

  async function handleFinalize() {
    setFinalizing(true);
    setMessage(null);
    const res = await fetch('/api/dashboard/finalize-simple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month }),
    });
    const data = await res.json();
    setFinalizing(false);
    if (!res.ok) {
      setMessage(data.error ?? 'Could not close this month.');
      return;
    }
    setMessage('Month saved and closed.');
    loadRollup();
  }

  function handleExportExcel() {
    if (!rollup) return;
    const headers = ['KPI', 'Weight', 'Target', 'Achievement', 'Achievement %', 'Weighted Score'];
    const dataRows: Cell[][] = rollup.kpiTable.map((k) => [
      k.name,
      `${k.weightPct}%`,
      k.target !== null ? `${k.target} ${k.uom}` : '',
      k.achievement !== null ? `${k.achievement} ${k.uom}` : '',
      k.achievementPct !== null ? `${k.achievementPct.toFixed(1)}%` : '',
      Number(k.weightedScore.toFixed(2)),
    ]);
    dataRows.push([
      `Weighted average (${rollup.kpiTotals.entriesComplete}/${rollup.kpiTotals.totalKpis} KPIs entered)`,
      '',
      '',
      '',
      '',
      Number(rollup.kpiTotals.weightedScoreSum.toFixed(2)),
    ]);
    downloadExcel(`dashboard_cluster_${month}.xlsx`, 'Dashboard', [headers, ...dataRows]);
  }

  return (
    <main className="min-h-screen bg-bg px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between print:hidden">
          <Link
            href="/"
            className="text-sm text-muted transition-colors hover:text-gold"
          >
            ← Back
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/goals"
              className="group inline-flex items-center gap-1.5 rounded-full border border-gold-dim bg-gold/10 px-3.5 py-1.5 text-xs font-semibold text-gold transition-all duration-200 hover:border-gold hover:bg-gold/20 hover:shadow-[0_0_0_3px_rgba(27,58,107,0.14)]"
            >
              Overall KPI Goals
              <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                →
              </span>
            </Link>
            <Link
              href="/dashboard/overall-report"
              className="group inline-flex items-center gap-1.5 rounded-full border border-gold-dim bg-gold/10 px-3.5 py-1.5 text-xs font-semibold text-gold transition-all duration-200 hover:border-gold hover:bg-gold/20 hover:shadow-[0_0_0_3px_rgba(27,58,107,0.14)]"
            >
              Overall Report
              <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                →
              </span>
            </Link>
            <span className="font-mono text-xs text-muted">
              Enroll {enrollNumber}
            </span>
          </div>
        </div>

        <div className="mb-8 flex flex-col gap-6 border-b border-line pb-6">
          <div className="flex items-center gap-4">
            <BrandMark />
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold">
                Cluster rollup
              </p>
              <h1 className="font-display text-2xl uppercase tracking-wide text-ink">
                Cluster KPI Dashboard
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <label className="flex flex-col gap-1.5 text-sm print:hidden">
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

            <button
              type="button"
              onClick={loadRollup}
              disabled={loadingRollup}
              className="self-end rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-gold disabled:opacity-50 print:hidden"
            >
              {loadingRollup ? 'Refreshing…' : '↻ Refresh'}
            </button>
            <span className="hidden font-mono text-sm font-medium text-ink print:inline">
              {monthLabel(month)}
            </span>
          </div>
        </div>

        {message && (
          <div className="mb-6 rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-ink print:hidden">
            {message}
          </div>
        )}

        {loadingRollup || !rollup ? (
          <div className="mb-8 flex flex-wrap gap-5">
            <div className="flex flex-1 items-center gap-6 rounded-lg border border-line bg-surface-2 p-6" style={{ minWidth: 280 }}>
              <Skeleton className="h-[110px] w-[110px] shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
            <div className="flex-[2] rounded-lg border border-line bg-surface-2 p-6" style={{ minWidth: 340 }}>
              <Skeleton className="mb-4 h-3 w-40" />
              <div className="flex flex-wrap justify-around gap-4">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-[76px] w-[76px] rounded-full" />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8 flex flex-wrap gap-5">
              <div
                className="flex flex-1 items-center gap-6 rounded-lg border border-line bg-surface-2 p-6"
                style={{ minWidth: 280 }}
              >
                <Gauge percent={rollup.kpiTotals.weightedScoreSum} size={110} color="var(--color-gold)" />
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-gold">
                    Overall cluster score
                  </p>
                  <div className="font-display text-4xl text-gold">
                    {rollup.kpiTotals.weightedScoreSum.toFixed(1)}
                    <span className="text-base text-muted">/100</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {rollup.kpiTotals.entriesComplete}/{rollup.kpiTotals.totalKpis} KPIs entered
                  </p>
                </div>
              </div>

              <div className="flex-[2] rounded-lg border border-line bg-surface-2 p-6" style={{ minWidth: 340 }}>
                <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.15em] text-muted">
                  Perspective breakdown
                </p>
                <div className="flex flex-wrap justify-around gap-4">
                  {rollup.perspectives.map((p) => (
                    <div key={p.perspective} className="text-center">
                      <Gauge
                        percent={p.achievementPct}
                        size={76}
                        color={PERSPECTIVE_COLOR[p.perspective]}
                      />
                      <div
                        className="mt-1.5 max-w-[100px] text-xs font-medium"
                        style={{ color: PERSPECTIVE_COLOR[p.perspective] }}
                      >
                        {p.perspective}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <section className="mb-8 rounded-lg border border-line bg-surface-2 p-6">
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="font-display text-xl text-ink">Perspective completion</h2>
                <span className="font-mono text-xs text-muted">
                  {rollup.completion.perspectivesComplete}/{rollup.completion.totalPerspectives} submitted
                </span>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {rollup.perspectiveStatus.map((p) => (
                  <div
                    key={p.perspective}
                    className="flex items-center justify-between gap-3 rounded-md border border-line px-4 py-2.5"
                    style={{
                      background: `color-mix(in oklch, ${PERSPECTIVE_COLOR[p.perspective]} 7%, var(--color-surface))`,
                    }}
                  >
                    <span
                      className="flex items-center gap-2 text-sm font-medium"
                      style={{ color: PERSPECTIVE_COLOR[p.perspective] }}
                    >
                      <span
                        className="inline-block h-2 w-2 shrink-0 rounded-full"
                        style={{
                          background: p.submitted
                            ? 'var(--color-status-good)'
                            : 'var(--color-muted-2)',
                        }}
                      />
                      {p.perspective}
                    </span>
                    <span
                      className={`font-mono text-xs ${p.submitted ? 'text-status-good' : 'text-muted'}`}
                    >
                      {p.submitted ? 'Submitted' : 'Not submitted'}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        <section className="mb-8 rounded-lg border border-line bg-surface-2 p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-xl text-ink">KPI detail — cluster</h2>
              <div className="flex items-center gap-4 print:hidden">
                <button
                  type="button"
                  onClick={handleExportExcel}
                  disabled={!rollup}
                  className="rounded-lg bg-gold px-4 py-2 text-xs font-semibold text-[color:var(--color-on-gold)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Export to Excel
                </button>
                <Link
                  href={`/dashboard/report?month=${month}`}
                  className="text-sm text-gold transition-colors hover:text-gold-dark"
                >
                  Detailed report →
                </Link>
              </div>
            </div>

            {loadingRollup || !rollup ? (
              <div className="space-y-2.5">
                {Array.from({ length: 9 }).map((_, i) => (
                  <Skeleton key={i} className="h-7 w-full" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                      <th className="py-2 pr-3 font-medium">KPI</th>
                      <th className="py-2 pr-3 font-medium">Weight</th>
                      <th className="py-2 pr-3 font-medium">Target</th>
                      <th className="py-2 pr-3 font-medium">Achievement</th>
                      <th className="py-2 pr-3 font-medium">Achievement %</th>
                      <th className="py-2 pl-3 text-right font-medium">Weighted score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rollup.kpiTable.map((k, i) => (
                      <tr key={k.kpiId} className="border-b border-line-soft">
                        <td className="py-2 pr-3 text-ink">
                          <span
                            className="mr-1.5 font-mono text-[10px]"
                            style={{ color: PERSPECTIVE_COLOR[k.perspective] }}
                          >
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          {k.name}
                        </td>
                        <td className="py-2 pr-3 font-mono text-muted">{k.weightPct}%</td>
                        <td className="py-2 pr-3 font-mono text-ink">
                          {k.target !== null ? `${k.target} ${k.uom}` : '—'}
                        </td>
                        <td className="py-2 pr-3 font-mono text-ink">
                          {k.achievement !== null ? `${k.achievement} ${k.uom}` : '—'}
                        </td>
                        <td className="py-2 pr-3 font-mono text-ink">
                          <span className="inline-flex items-center gap-1.5">
                            <StatusDot pct={k.achievementPct} />
                            {k.achievementPct !== null ? `${k.achievementPct.toFixed(1)}%` : '—'}
                          </span>
                        </td>
                        <td className="py-2 pl-3 text-right font-mono text-gold">
                          {k.weightedScore.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-ink/20 font-semibold">
                      <td className="py-3 pr-3 text-ink" colSpan={4}>
                        Weighted average ({rollup.kpiTotals.entriesComplete}/
                        {rollup.kpiTotals.totalKpis} KPIs entered)
                      </td>
                      <td className="py-3 pl-3 text-right font-mono text-gold">
                        {rollup.kpiTotals.weightedScoreSum.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
        </section>

        <section className="rounded-lg border border-line bg-surface-2 p-6">
          <div className="mb-1 flex items-baseline justify-between">
            <h2 className="font-display text-xl text-ink">Save this month</h2>
            {rollup && (
              <span className="font-mono text-xs text-muted">
                {rollup.completion.perspectivesComplete}/{rollup.completion.totalPerspectives}
              </span>
            )}
          </div>

          {loadingRollup || !rollup ? (
            <div className="my-6 space-y-4">
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-10 w-48" />
            </div>
          ) : (
            <>
              <div className="my-6 h-2 w-full overflow-hidden rounded-full bg-surface-3 print:hidden">
                <div
                  className="h-full rounded-full bg-status-good transition-all duration-300 ease-out"
                  style={{
                    width: `${(rollup.completion.perspectivesComplete / rollup.completion.totalPerspectives) * 100}%`,
                  }}
                />
              </div>

              <div className="flex flex-wrap items-center gap-4 print:hidden">
                {rollup.finalized ? (
                  <span className="inline-flex items-center rounded-full bg-status-good-bg px-3 py-1.5 text-sm font-medium text-status-good">
                    Saved &amp; closed by {rollup.finalized.finalized_by_enroll} on{' '}
                    {new Date(rollup.finalized.finalized_at).toLocaleDateString()}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinalize}
                    disabled={!rollup.completion.allComplete || finalizing}
                    className="rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-[color:var(--color-on-gold)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {finalizing ? 'Saving…' : 'Save and close'}
                  </button>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
