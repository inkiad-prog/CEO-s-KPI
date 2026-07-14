'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { BrandMark } from '@/components/BrandMark';
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

type SbuCell = {
  sbuId: number;
  sbuName: string;
  target: number | null;
  achievement: number | null;
  achievementPct: number | null;
  weightedScore: number | null;
};

type ReportRow = {
  kpiId: number;
  sl: number;
  perspective: Perspective;
  strategic_goal: string;
  name: string;
  weight_pct: string;
  direction: 'higher_better' | 'lower_better';
  industry_benchmark: string;
  uom: string;
  goalUom: string;
  target_validation: string | null;
  kpi_driver: string;
  measurement_criteria: string;
  data_source: string;
  frequency: string;
  evidence_type: string;
  evidence_link_label: string;
  evidence_owner_role: string;
  required_evidence: string;
  capturing_method: string;
  perSbu: SbuCell[];
  clusterGoal: number | null;
  sumTarget: number;
  sumAchievement: number;
  achievementPct: number | null;
  weightedScore: number;
};

type SbuStatus = {
  sbuId: number;
  sbuName: string;
  rolesSubmitted: number;
  totalRoles: number;
  isComplete: boolean;
};

type ApiResponse =
  | {
      finalized: false;
      sbuStatus: SbuStatus[];
      completion: { sbusComplete: number; totalSbus: number };
    }
  | {
      finalized: { finalized_by_enroll: string; finalized_at: string };
      sbus: { id: number; name: string }[];
      rows: ReportRow[];
    };

export function OverallReportClient({ enrollNumber }: { enrollNumber: string }) {
  const [month, setMonth] = useState(currentMonthValue);
  const [group, setGroup] = useState<'all' | SbuGroup>('all');
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/dashboard/overall-report?month=${month}&group=${group}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [month, group]);

  useEffect(() => {
    load();
  }, [load]);

  function handleExportExcel() {
    if (!data || !('rows' in data)) return;
    const baseHead = [
      'SL', 'Perspective', 'Strategic Goal', 'KPI', 'Weight', 'KPI Direction',
      'Industry Target Benchmark', 'UOM',
    ];
    const tailHead = [
      'Target Validation', 'KPI Driver', 'Measurement Criteria',
      'Data Source', 'Frequency', 'Evidence Type', 'Evidence Link', 'Evidence Owner',
      'Required Evidence', 'Capturing Method',
    ];

    const headerRow1: Cell[] = [
      ...baseHead,
      ...data.sbus.flatMap((s) => [s.name, '', '', '']),
      'Cluster', '', '', '', '',
      ...tailHead,
    ];
    const headerRow2: Cell[] = [
      ...baseHead.map(() => ''),
      ...data.sbus.flatMap(() => ['Target', 'Achv.', '%', 'W.Score']),
      'Overall Goal', 'Σ Target', 'Σ Achv.', '%', 'Weighted Score',
      ...tailHead.map(() => ''),
    ];

    const dataRows: Cell[][] = data.rows.map((r) => [
      r.sl,
      r.perspective,
      r.strategic_goal,
      r.name,
      `${Number(r.weight_pct)}%`,
      r.direction === 'higher_better' ? 'Higher Better' : 'Lower Better',
      r.industry_benchmark,
      r.uom,
      ...r.perSbu.flatMap((cell) => [
        cell.target ?? '',
        cell.achievement ?? '',
        cell.achievementPct !== null ? `${cell.achievementPct.toFixed(0)}%` : '',
        cell.weightedScore !== null ? Number(cell.weightedScore.toFixed(2)) : '',
      ]),
      r.clusterGoal !== null ? `${r.clusterGoal} ${r.goalUom}` : '',
      Number(r.sumTarget.toFixed(1)),
      Number(r.sumAchievement.toFixed(1)),
      r.achievementPct !== null ? `${r.achievementPct.toFixed(1)}%` : '',
      Number(r.weightedScore.toFixed(2)),
      r.target_validation ?? '',
      r.kpi_driver,
      r.measurement_criteria,
      r.data_source,
      r.frequency,
      r.evidence_type,
      r.evidence_link_label,
      r.evidence_owner_role,
      r.required_evidence,
      r.capturing_method,
    ]);

    const baseCols = baseHead.length;
    const sbuCols = data.sbus.length * 4;
    const clusterStart = baseCols + sbuCols;
    const tailStart = clusterStart + 5;

    const merges = [
      // vertically merge the base columns across the 2 header rows
      ...baseHead.map((_, i) => ({ s: { r: 0, c: i }, e: { r: 1, c: i } })),
      // horizontally merge each SBU's 4-column group in row 0
      ...data.sbus.map((_, i) => ({
        s: { r: 0, c: baseCols + i * 4 },
        e: { r: 0, c: baseCols + i * 4 + 3 },
      })),
      // "Cluster" group header spanning its 5 sub-columns
      { s: { r: 0, c: clusterStart }, e: { r: 0, c: clusterStart + 4 } },
      // vertically merge the trailing reference columns
      ...tailHead.map((_, i) => ({
        s: { r: 0, c: tailStart + i },
        e: { r: 1, c: tailStart + i },
      })),
    ];

    downloadExcel(
      `overall_report_${group}_${month}.xlsx`,
      'Overall Report',
      [headerRow1, headerRow2, ...dataRows],
      merges
    );
  }

  return (
    <main className="min-h-screen bg-bg px-6 py-10">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-6 flex items-center justify-between print:hidden">
          <Link
            href="/dashboard/home"
            className="text-sm text-muted transition-colors hover:text-gold"
          >
            ← Back to dashboard
          </Link>
          <span className="font-mono text-xs text-muted">Enroll {enrollNumber}</span>
        </div>

        <div className="mb-8 flex flex-col gap-6 border-b border-line pb-6">
          <div className="flex items-center gap-4">
            <BrandMark />
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold">
                Overall report
              </p>
              <h1 className="font-display text-2xl uppercase tracking-wide text-ink">
                {group === 'all' ? 'All SBUs — full scorecard' : `${SBU_GROUP_LABEL[group]} — full scorecard`}
              </h1>
            </div>
          </div>

          {data && 'rows' in data && (
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

          <div className="flex flex-wrap items-end gap-4 print:hidden">
            <label className="flex flex-col gap-1.5 text-sm">
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
              onClick={load}
              disabled={loading}
              className="self-end rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-gold disabled:opacity-50"
            >
              {loading ? 'Refreshing…' : '↻ Refresh'}
            </button>
            {data && 'rows' in data && (
              <button
                type="button"
                onClick={handleExportExcel}
                className="rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-[color:var(--color-on-gold)] transition-opacity hover:opacity-90"
              >
                Export to Excel
              </button>
            )}
          </div>
          <span className="hidden font-mono text-sm font-medium text-ink print:inline">
            {monthLabel(month)}
          </span>
        </div>

        {loading || !data ? (
          <div className="space-y-2.5 rounded-lg border border-line bg-surface-2 p-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        ) : !('rows' in data) ? (
          <div className="rounded-lg border border-line bg-surface-2 p-6">
            <p className="text-sm text-ink">
              This report becomes downloadable once every SBU has finished
              submitting all roles for {monthLabel(month)} and the month is
              finalized on the Dashboard.
            </p>
            <p className="mt-2 font-mono text-xs text-muted">
              {data.completion.sbusComplete}/{data.completion.totalSbus} SBUs complete
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {data.sbuStatus.map((s) => (
                <span
                  key={s.sbuId}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                    s.isComplete
                      ? 'bg-status-good-bg text-status-good'
                      : 'bg-surface-3 text-muted'
                  }`}
                >
                  {s.isComplete ? '✓' : `${s.rolesSubmitted}/${s.totalRoles}`} {s.sbuName}
                </span>
              ))}
            </div>
            <Link
              href="/dashboard/home"
              className="mt-6 inline-block text-sm text-gold transition-colors hover:text-gold-dark"
            >
              ← Go finalize the month
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-4 text-xs text-muted">
              Finalized by {data.finalized.finalized_by_enroll} on{' '}
              {new Date(data.finalized.finalized_at).toLocaleDateString()}
            </p>
            <div className="overflow-x-auto rounded-lg border border-line bg-surface-2 p-4">
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr className="text-left uppercase tracking-wide text-muted">
                    <th rowSpan={2} className="sticky left-0 z-10 whitespace-nowrap border-b border-line bg-surface-2 px-2 py-2 font-medium">SL</th>
                    <th rowSpan={2} className="whitespace-nowrap border-b border-line px-2 py-2 font-medium">Perspective</th>
                    <th rowSpan={2} className="whitespace-nowrap border-b border-line px-2 py-2 font-medium">Strategic Goal</th>
                    <th rowSpan={2} className="whitespace-nowrap border-b border-line px-2 py-2 font-medium">KPI</th>
                    <th rowSpan={2} className="whitespace-nowrap border-b border-line px-2 py-2 font-medium">Weight</th>
                    <th rowSpan={2} className="whitespace-nowrap border-b border-line px-2 py-2 font-medium">Direction</th>
                    <th rowSpan={2} className="whitespace-nowrap border-b border-line px-2 py-2 font-medium">Benchmark</th>
                    <th rowSpan={2} className="whitespace-nowrap border-b border-line px-2 py-2 font-medium">UOM</th>
                    {data.sbus.map((s) => (
                      <th
                        key={s.id}
                        colSpan={4}
                        className="whitespace-nowrap border-b border-l border-line px-2 py-1 text-center font-medium text-gold"
                      >
                        {s.name}
                      </th>
                    ))}
                    <th colSpan={5} className="whitespace-nowrap border-b border-l border-line px-2 py-1 text-center font-medium text-gold">
                      Cluster
                    </th>
                    <th rowSpan={2} className="whitespace-nowrap border-b border-line px-2 py-2 font-medium">Target Validation</th>
                    <th rowSpan={2} className="whitespace-nowrap border-b border-line px-2 py-2 font-medium">KPI Driver</th>
                    <th rowSpan={2} className="whitespace-nowrap border-b border-line px-2 py-2 font-medium">Measurement Criteria</th>
                    <th rowSpan={2} className="whitespace-nowrap border-b border-line px-2 py-2 font-medium">Data Source</th>
                    <th rowSpan={2} className="whitespace-nowrap border-b border-line px-2 py-2 font-medium">Frequency</th>
                    <th rowSpan={2} className="whitespace-nowrap border-b border-line px-2 py-2 font-medium">Evidence Type</th>
                    <th rowSpan={2} className="whitespace-nowrap border-b border-line px-2 py-2 font-medium">Evidence Link</th>
                    <th rowSpan={2} className="whitespace-nowrap border-b border-line px-2 py-2 font-medium">Evidence Owner</th>
                    <th rowSpan={2} className="whitespace-nowrap border-b border-line px-2 py-2 font-medium">Required Evidence</th>
                    <th rowSpan={2} className="whitespace-nowrap border-b border-line px-2 py-2 font-medium">Capturing Method</th>
                  </tr>
                  <tr className="text-left uppercase tracking-wide text-muted">
                    {data.sbus.map((s) => (
                      <Fragment key={s.id}>
                        <th className="whitespace-nowrap border-b border-l border-line px-2 py-1 font-medium">Target</th>
                        <th className="whitespace-nowrap border-b border-line px-2 py-1 font-medium">Achv.</th>
                        <th className="whitespace-nowrap border-b border-line px-2 py-1 font-medium">%</th>
                        <th className="whitespace-nowrap border-b border-line px-2 py-1 font-medium">W.Score</th>
                      </Fragment>
                    ))}
                    <th className="whitespace-nowrap border-b border-l border-line px-2 py-1 font-medium">Overall Goal</th>
                    <th className="whitespace-nowrap border-b border-line px-2 py-1 font-medium">Σ Target</th>
                    <th className="whitespace-nowrap border-b border-line px-2 py-1 font-medium">Σ Achv.</th>
                    <th className="whitespace-nowrap border-b border-line px-2 py-1 font-medium">%</th>
                    <th className="whitespace-nowrap border-b border-line px-2 py-1 font-medium">Weighted Score</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((r) => (
                    <tr key={r.kpiId} className="border-b border-line-soft align-top">
                      <td className="sticky left-0 z-10 bg-surface-2 px-2 py-2 font-mono text-ink">{r.sl}</td>
                      <td className="px-2 py-2">
                        <span style={{ color: PERSPECTIVE_COLOR[r.perspective] }}>{r.perspective}</span>
                      </td>
                      <td className="max-w-[160px] px-2 py-2 text-ink">{r.strategic_goal}</td>
                      <td className="max-w-[180px] px-2 py-2 text-ink">{r.name}</td>
                      <td className="px-2 py-2 font-mono text-muted">{Number(r.weight_pct)}%</td>
                      <td className="whitespace-nowrap px-2 py-2 text-muted">
                        {r.direction === 'higher_better' ? 'Higher' : 'Lower'}
                      </td>
                      <td className="max-w-[140px] px-2 py-2 text-muted">{r.industry_benchmark}</td>
                      <td className="px-2 py-2 text-muted">{r.uom}</td>
                      {r.perSbu.map((cell) => (
                        <Fragment key={cell.sbuId}>
                          <td className="whitespace-nowrap border-l border-line-soft px-2 py-2 font-mono text-ink">
                            {cell.target ?? '—'}
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 font-mono text-ink">
                            {cell.achievement ?? '—'}
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 font-mono text-muted">
                            {cell.achievementPct !== null ? `${cell.achievementPct.toFixed(0)}%` : '—'}
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 font-mono text-gold">
                            {cell.weightedScore !== null ? cell.weightedScore.toFixed(2) : '—'}
                          </td>
                        </Fragment>
                      ))}
                      <td className="whitespace-nowrap border-l border-line-soft px-2 py-2 font-mono text-muted">
                        {r.clusterGoal !== null ? `${r.clusterGoal} ${r.goalUom}` : '—'}
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 font-mono text-ink">{r.sumTarget.toFixed(1)}</td>
                      <td className="whitespace-nowrap px-2 py-2 font-mono text-ink">{r.sumAchievement.toFixed(1)}</td>
                      <td className="whitespace-nowrap px-2 py-2 font-mono text-ink">
                        <span className="inline-flex items-center gap-1.5">
                          <StatusDot pct={r.achievementPct} />
                          {r.achievementPct !== null ? `${r.achievementPct.toFixed(1)}%` : '—'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 font-mono text-gold">
                        {r.weightedScore.toFixed(2)}
                      </td>
                      <td className="max-w-[160px] px-2 py-2 text-muted">{r.target_validation}</td>
                      <td className="max-w-[180px] px-2 py-2 text-muted">{r.kpi_driver}</td>
                      <td className="max-w-[220px] px-2 py-2 font-mono text-[10px] text-muted-2">
                        {r.measurement_criteria}
                      </td>
                      <td className="max-w-[140px] px-2 py-2 text-muted">{r.data_source}</td>
                      <td className="whitespace-nowrap px-2 py-2 text-muted">{r.frequency}</td>
                      <td className="whitespace-nowrap px-2 py-2 text-muted">{r.evidence_type}</td>
                      <td className="whitespace-nowrap px-2 py-2 text-muted">{r.evidence_link_label}</td>
                      <td className="whitespace-nowrap px-2 py-2 text-muted">{r.evidence_owner_role}</td>
                      <td className="max-w-[160px] px-2 py-2 text-muted">{r.required_evidence}</td>
                      <td className="whitespace-nowrap px-2 py-2 text-muted">{r.capturing_method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
