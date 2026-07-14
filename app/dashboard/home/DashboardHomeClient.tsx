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
  SBU_GROUP_LABEL,
  currentMonthValue,
  monthLabel,
  type Perspective,
  type SbuGroup,
} from '@/lib/kpi';
import { downloadExcel, type Cell } from '@/lib/exportExcel';

type SbuRollup = {
  sbuId: number;
  sbuName: string;
  clusterGroup: SbuGroup;
  achievement: number;
  kpiCount: number;
  totalKpis: number;
  rolesSubmitted: number;
  totalRoles: number;
  isComplete: boolean;
};

type KpiTableRow = {
  kpiId: number;
  sl: number;
  perspective: Perspective;
  name: string;
  weightPct: number;
  uom: string;
  goalUom: string;
  clusterGoal: number | null;
  target: number | null;
  achievement: number | null;
  achievementPct: number | null;
  weightedScore: number;
  entryCount: number;
};

type RollupResponse = {
  scope: string;
  kpiTable: KpiTableRow[];
  kpiTotals: { weightedScoreSum: number; entriesComplete: number; totalKpis: number };
  sbus: SbuRollup[];
  perspectives: { perspective: Perspective; achievementPct: number }[];
  roleStatus: { role: string; submitted: boolean }[] | null;
  completion: { sbusComplete: number; totalSbus: number; allComplete: boolean };
  finalized: { finalized_by_enroll: string; finalized_at: string } | null;
};

export function DashboardHomeClient({
  enrollNumber,
}: {
  enrollNumber: string;
}) {
  const [month, setMonth] = useState(currentMonthValue);
  const [scope, setScope] = useState('all');
  const [group, setGroup] = useState<'all' | SbuGroup>('all');
  const [rollup, setRollup] = useState<RollupResponse | null>(null);
  const [loadingRollup, setLoadingRollup] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // The group tabs (Overall / Trading / Logistics) only refine the "All
  // SBUs" view; picking a specific SBU always overrides them.
  const apiScope = scope === 'all' ? group : scope;
  const groupLabel = scope === 'all' && group !== 'all' ? SBU_GROUP_LABEL[group] : null;

  const loadRollup = useCallback(async () => {
    setLoadingRollup(true);
    const res = await fetch(`/api/dashboard/rollup?month=${month}&scope=${apiScope}`);
    const data = await res.json();
    setRollup(data);
    setLoadingRollup(false);
  }, [month, apiScope]);

  useEffect(() => {
    setMessage(null);
    loadRollup();
  }, [loadRollup]);

  async function handleFinalize() {
    setFinalizing(true);
    setMessage(null);
    const res = await fetch('/api/dashboard/finalize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month }),
    });
    const data = await res.json();
    setFinalizing(false);
    if (!res.ok) {
      setMessage(data.error ?? 'Could not finalize this month.');
      return;
    }
    setMessage('Month finalized and locked.');
    loadRollup();
  }

  const groupedSbus = rollup
    ? rollup.sbus.filter((s) => group === 'all' || s.clusterGroup === group)
    : [];
  const maxSbuScore = Math.max(1, ...groupedSbus.map((s) => s.achievement));

  const scopedSbuName =
    rollup && scope !== 'all'
      ? rollup.sbus.find((s) => String(s.sbuId) === scope)?.sbuName
      : null;

  function handleExportExcel() {
    if (!rollup) return;
    const headers = [
      'KPI', 'Weight',
      ...(scope === 'all'
        ? ['Overall Goal', 'Σ Target', 'Σ Achievement']
        : ['Target', 'Achievement']),
      'Achievement %', 'Weighted Score',
    ];
    const dataRows: Cell[][] = rollup.kpiTable.map((k) => [
      k.name,
      `${k.weightPct}%`,
      ...(scope === 'all'
        ? [
            k.clusterGoal !== null ? `${k.clusterGoal} ${k.goalUom}` : '',
            k.target !== null ? `${k.target.toFixed(1)} ${k.uom}` : '',
            k.achievement !== null ? `${k.achievement.toFixed(1)} ${k.uom}` : '',
          ]
        : [
            k.target !== null ? `${k.target} ${k.uom}` : '',
            k.achievement !== null ? `${k.achievement} ${k.uom}` : '',
          ]),
      k.achievementPct !== null ? `${k.achievementPct.toFixed(1)}%` : '',
      Number(k.weightedScore.toFixed(2)),
    ]);
    dataRows.push([
      `Weighted average (${rollup.kpiTotals.entriesComplete}/${rollup.kpiTotals.totalKpis} KPIs entered)`,
      ...Array(headers.length - 2).fill(''),
      Number(rollup.kpiTotals.weightedScoreSum.toFixed(2)),
    ]);
    downloadExcel(
      `dashboard_${scopedSbuName ?? groupLabel ?? 'cluster'}_${month}.xlsx`.replace(/\s+/g, '_'),
      'Dashboard',
      [headers, ...dataRows]
    );
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
                {scopedSbuName ?? groupLabel ?? 'Cluster rollup'}
              </p>
              <h1 className="font-display text-2xl uppercase tracking-wide text-ink">
                {scopedSbuName ?? groupLabel ?? 'Trading Cluster Dashboard'}
              </h1>
            </div>
          </div>

          {scope === 'all' && (
            <div className="flex gap-2 print:hidden">
              {(['all', 'trading', 'logistics'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGroup(g)}
                  className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
                    group === g
                      ? 'border-gold bg-gold text-[color:var(--color-on-gold)]'
                      : 'border-line bg-surface-2 text-muted hover:border-gold-dim hover:text-ink'
                  }`}
                >
                  {g === 'all' ? 'Overall' : SBU_GROUP_LABEL[g]}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-end gap-4">
            <label className="flex flex-col gap-1.5 text-sm print:hidden">
              <span className="font-medium text-ink">SBU</span>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-ink outline-none focus:border-gold"
              >
                <option value="all">All SBUs (cluster)</option>
                {rollup?.sbus.map((s) => (
                  <option key={s.sbuId} value={s.sbuId}>
                    {s.sbuName}
                  </option>
                ))}
              </select>
            </label>
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
                    {scopedSbuName
                      ? `${scopedSbuName} score`
                      : groupLabel
                        ? `${groupLabel} score`
                        : 'Overall cluster score'}
                  </p>
                  <div className="font-display text-4xl text-gold">
                    {rollup.kpiTotals.weightedScoreSum.toFixed(1)}
                    <span className="text-base text-muted">/100</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {scopedSbuName
                      ? `${rollup.kpiTotals.entriesComplete}/${rollup.kpiTotals.totalKpis} KPIs entered`
                      : `Weighted across ${rollup.completion.totalSbus} SBUs`}
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
                      <div className="mt-1.5 max-w-[100px] text-xs text-muted">
                        {p.perspective}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {scope === 'all' && (
              <div className="mb-8 rounded-lg border border-line bg-surface-2 p-6">
                <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.15em] text-muted">
                  SBU comparison — overall weighted score
                </p>
                <div className="flex flex-col gap-2.5">
                  {[...groupedSbus]
                    .sort((a, b) => b.achievement - a.achievement)
                    .map((s, i) => {
                      const width = Math.max(2, Math.min(100, (s.achievement / maxSbuScore) * 100));
                      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
                      return (
                        <button
                          key={s.sbuId}
                          type="button"
                          onClick={() => setScope(String(s.sbuId))}
                          className="flex w-full items-center gap-3 rounded-md text-left transition-opacity hover:opacity-80"
                        >
                          <div className="flex w-6 shrink-0 items-center justify-center font-mono text-xs text-muted">
                            {medal ?? i + 1}
                          </div>
                          <div className="w-40 shrink-0 truncate text-xs text-muted">
                            {s.sbuName}
                          </div>
                          <div className="h-4 flex-1 overflow-hidden rounded-md border border-line bg-surface">
                            <div
                              className="h-full rounded-md bg-gold transition-all duration-300 ease-out"
                              style={{ width: `${width}%` }}
                            />
                          </div>
                          <div className="w-14 shrink-0 text-right font-mono text-xs text-gold">
                            {s.achievement.toFixed(1)}
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

          </>
        )}

        <section className="mb-8 rounded-lg border border-line bg-surface-2 p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl text-ink">
              KPI detail — {scopedSbuName ?? groupLabel ?? 'All SBUs (cluster average)'}
            </h2>
            <Link
              href={`/dashboard/report?sbuId=${apiScope}&month=${month}`}
              className="text-sm text-gold transition-colors hover:text-gold-dark print:hidden"
            >
              Detailed report →
            </Link>
          </div>

          {loadingRollup || !rollup ? (
            <div className="space-y-2.5">
              {Array.from({ length: 8 }).map((_, i) => (
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
                    {scope === 'all' ? (
                      <>
                        <th className="py-2 pr-3 font-medium">Overall goal</th>
                        <th className="py-2 pr-3 font-medium">Σ Target</th>
                        <th className="py-2 pr-3 font-medium">Σ Achievement</th>
                      </>
                    ) : (
                      <>
                        <th className="py-2 pr-3 font-medium">Target</th>
                        <th className="py-2 pr-3 font-medium">Achievement</th>
                      </>
                    )}
                    <th className="py-2 pr-3 font-medium">Achievement %</th>
                    <th className="py-2 pl-3 text-right font-medium">
                      Weighted score
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rollup.kpiTable.map((k) => (
                    <tr key={k.kpiId} className="border-b border-line-soft">
                      <td className="py-2 pr-3 text-ink">
                        <span
                          className="mr-1.5 font-mono text-[10px]"
                          style={{ color: PERSPECTIVE_COLOR[k.perspective] }}
                        >
                          {String(k.sl).padStart(2, '0')}
                        </span>
                        {k.name}
                      </td>
                      <td className="py-2 pr-3 font-mono text-muted">
                        {k.weightPct}%
                      </td>
                      {scope === 'all' ? (
                        <>
                          <td className="py-2 pr-3 font-mono text-muted">
                            {k.clusterGoal !== null ? `${k.clusterGoal} ${k.goalUom}` : '—'}
                          </td>
                          <td className="py-2 pr-3 font-mono text-ink">
                            {k.target !== null ? `${k.target.toFixed(1)} ${k.uom}` : '—'}
                          </td>
                          <td className="py-2 pr-3 font-mono text-ink">
                            {k.achievement !== null ? `${k.achievement.toFixed(1)} ${k.uom}` : '—'}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-2 pr-3 font-mono text-ink">
                            {k.target !== null ? `${k.target} ${k.uom}` : '—'}
                          </td>
                          <td className="py-2 pr-3 font-mono text-ink">
                            {k.achievement !== null ? `${k.achievement} ${k.uom}` : '—'}
                          </td>
                        </>
                      )}
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
                    <td className="py-3 pr-3 text-ink" colSpan={scope === 'all' ? 5 : 4}>
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
            <h2 className="font-display text-xl text-ink">
              Cluster completion
            </h2>
            {rollup && (
              <span className="font-mono text-xs text-muted">
                {rollup.completion.sbusComplete}/{rollup.completion.totalSbus}{' '}
                complete
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
                    width: `${
                      rollup.completion.totalSbus
                        ? (rollup.completion.sbusComplete /
                            rollup.completion.totalSbus) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>

              <div className="flex flex-wrap items-center gap-4 print:hidden">
                {rollup.finalized ? (
                  <span className="inline-flex items-center rounded-full bg-status-good-bg px-3 py-1.5 text-sm font-medium text-status-good">
                    Finalized by {rollup.finalized.finalized_by_enroll} on{' '}
                    {new Date(rollup.finalized.finalized_at).toLocaleDateString()}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinalize}
                    disabled={!rollup.completion.allComplete || finalizing}
                    className="rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-[color:var(--color-on-gold)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {finalizing ? 'Saving…' : 'Save & finalize month'}
                  </button>
                )}

                {rollup.finalized && (
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-[color:var(--color-on-gold)] transition-opacity hover:opacity-90"
                  >
                    Export to Excel
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
