'use client';

import { useCallback, useEffect, useState } from 'react';
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
import { downloadExcel } from '@/lib/exportExcel';

type ReportRow = {
  sl: number;
  perspective: Perspective;
  strategic_goal: string;
  name: string;
  weight_pct: string;
  direction: 'higher_better' | 'lower_better';
  industry_benchmark: string;
  uom: string;
  target_validation: string | null;
  kpi_driver: string;
  measurement_criteria: string;
  data_source: string;
  frequency: string;
  evidence_type: string;
  evidence_link_label: string;
  evidence_owner_role: string;
  capturing_method: string;
  achievement_pct: number | null;
  weighted_score: number | null;
  // per-SBU scope
  target_value?: string | null;
  achievement_value?: string | null;
  evidence_link?: string | null;
  evidence_note?: string | null;
  entered_by_enroll?: string | null;
  updated_at?: string | null;
  // cluster scope
  clusterGoal?: number | null;
  goalUom?: string;
  sumTarget?: number;
  sumAchievement?: number;
  entryCount?: number;
  totalSbus?: number;
};

export function ReportClient({
  enrollNumber,
  sbus,
  initialSbuId,
  initialMonth,
}: {
  enrollNumber: string;
  sbus: { id: number; name: string }[];
  initialSbuId: string;
  initialMonth: string;
}) {
  const initialIsGroup = initialSbuId === 'trading' || initialSbuId === 'logistics';
  const [sbuId, setSbuId] = useState(initialIsGroup ? 'all' : initialSbuId || 'all');
  const [group, setGroup] = useState<'all' | SbuGroup>(
    initialIsGroup ? (initialSbuId as SbuGroup) : 'all'
  );
  const [month, setMonth] = useState(initialMonth || currentMonthValue());
  const [sbuName, setSbuName] = useState('');
  const [scope, setScope] = useState('all');
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  // The group tabs (Overall / Trading / Logistics) only refine the "All
  // SBUs" view; picking a specific SBU always overrides them.
  const apiSbuId = sbuId === 'all' ? group : sbuId;

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/dashboard/report?sbuId=${apiSbuId}&month=${month}`);
    const data = await res.json();
    setSbuName(data.sbuName ?? '');
    setScope(data.scope ?? 'all');
    setRows(data.rows ?? []);
    setLoading(false);
  }, [apiSbuId, month]);

  useEffect(() => {
    load();
  }, [load]);

  const isCluster = scope === 'all' || scope === 'trading' || scope === 'logistics';

  function handleExportExcel() {
    const headers = [
      'SL', 'Perspective', 'Strategic Goal', 'KPI', 'Weight', 'KPI Direction',
      'Industry Target Benchmark', 'UOM',
      ...(isCluster
        ? ['Overall Goal', 'Σ Target', 'Σ Achievement']
        : ['Target', 'Achievement']),
      '% Achievement', 'Weighted Score', 'Target Validation', 'KPI Driver',
      'Measurement Criteria', 'Data Source', 'Frequency', 'Evidence Type',
      ...(isCluster ? ['Completion'] : ['Evidence Link']),
      'Evidence Owner',
      ...(isCluster ? [] : ['Evidence Note']),
      'Capturing Method',
      ...(isCluster ? [] : ['Enroll Id', 'Time']),
    ];

    const dataRows = rows.map((r) => [
      r.sl,
      r.perspective,
      r.strategic_goal,
      r.name,
      `${Number(r.weight_pct)}%`,
      r.direction === 'higher_better' ? 'Higher Better' : 'Lower Better',
      r.industry_benchmark,
      r.uom,
      ...(isCluster
        ? [
            r.clusterGoal !== null && r.clusterGoal !== undefined
              ? `${r.clusterGoal} ${r.goalUom}`
              : '',
            r.sumTarget !== undefined ? Number(r.sumTarget.toFixed(1)) : '',
            r.sumAchievement !== undefined ? Number(r.sumAchievement.toFixed(1)) : '',
          ]
        : [r.target_value ?? '', r.achievement_value ?? '']),
      r.achievement_pct !== null && r.achievement_pct !== undefined
        ? `${Number(r.achievement_pct).toFixed(1)}%`
        : '',
      r.weighted_score !== null && r.weighted_score !== undefined
        ? Number(Number(r.weighted_score).toFixed(2))
        : '',
      r.target_validation ?? '',
      r.kpi_driver,
      r.measurement_criteria,
      r.data_source,
      r.frequency,
      r.evidence_type,
      ...(isCluster
        ? [`${r.entryCount ?? 0}/${r.totalSbus ?? 0} SBUs`]
        : [r.evidence_link ?? '']),
      r.evidence_owner_role,
      ...(isCluster ? [] : [r.evidence_note ?? '']),
      r.capturing_method,
      ...(isCluster
        ? []
        : [
            r.entered_by_enroll ?? '',
            r.updated_at ? new Date(r.updated_at).toLocaleString() : '',
          ]),
    ]);

    downloadExcel(
      `${(sbuName || 'report').replace(/\s+/g, '_')}_${month}.xlsx`,
      'Report',
      [headers, ...dataRows]
    );
  }

  return (
    <main className="min-h-screen bg-bg px-6 py-10">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-6 flex items-center justify-between print:hidden">
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

        <div className="mb-8 flex flex-col gap-6 border-b border-line pb-6">
          <div className="flex items-center gap-4">
            <BrandMark />
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold">
                Detailed report
              </p>
              <h1 className="font-display text-2xl uppercase tracking-wide text-ink">
                {sbuName || 'Loading…'}
              </h1>
            </div>
          </div>

          {sbuId === 'all' && (
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
              <span className="font-medium text-ink">SBU</span>
              <select
                value={sbuId}
                onChange={(e) => setSbuId(e.target.value)}
                className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-ink outline-none focus:border-gold"
              >
                <option value="all">All SBUs (cluster)</option>
                {sbus.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
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
            <button
              type="button"
              onClick={handleExportExcel}
              className="rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-[color:var(--color-on-gold)] transition-opacity hover:opacity-90"
            >
              Export to Excel
            </button>
          </div>
          <span className="hidden font-mono text-sm font-medium text-ink print:inline">
            {monthLabel(month)}
          </span>
        </div>

        {loading ? (
          <div className="space-y-2.5 rounded-lg border border-line bg-surface-2 p-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-line bg-surface-2 p-4">
            <table className="w-full min-w-[2400px] border-collapse text-xs">
              <thead>
                <tr className="border-b border-line text-left uppercase tracking-wide text-muted">
                  <th className="whitespace-nowrap px-2 py-2 font-medium">SL</th>
                  <th className="whitespace-nowrap px-2 py-2 font-medium">Perspective</th>
                  <th className="whitespace-nowrap px-2 py-2 font-medium">Strategic Goal</th>
                  <th className="whitespace-nowrap px-2 py-2 font-medium">KPI</th>
                  <th className="whitespace-nowrap px-2 py-2 font-medium">Weight</th>
                  <th className="whitespace-nowrap px-2 py-2 font-medium">KPI Direction</th>
                  <th className="whitespace-nowrap px-2 py-2 font-medium">Industry Target Benchmark</th>
                  <th className="whitespace-nowrap px-2 py-2 font-medium">UOM</th>
                  {isCluster ? (
                    <>
                      <th className="whitespace-nowrap px-2 py-2 font-medium">Overall Goal</th>
                      <th className="whitespace-nowrap px-2 py-2 font-medium">Σ Target</th>
                      <th className="whitespace-nowrap px-2 py-2 font-medium">Σ Achievement</th>
                    </>
                  ) : (
                    <>
                      <th className="whitespace-nowrap px-2 py-2 font-medium">Target</th>
                      <th className="whitespace-nowrap px-2 py-2 font-medium">Achievement</th>
                    </>
                  )}
                  <th className="whitespace-nowrap px-2 py-2 font-medium">% Achievement</th>
                  <th className="whitespace-nowrap px-2 py-2 font-medium">Weighted Score</th>
                  <th className="whitespace-nowrap px-2 py-2 font-medium">Target Validation</th>
                  <th className="whitespace-nowrap px-2 py-2 font-medium">KPI Driver</th>
                  <th className="whitespace-nowrap px-2 py-2 font-medium">Measurement Criteria</th>
                  <th className="whitespace-nowrap px-2 py-2 font-medium">Data Source</th>
                  <th className="whitespace-nowrap px-2 py-2 font-medium">Frequency</th>
                  <th className="whitespace-nowrap px-2 py-2 font-medium">Evidence Type</th>
                  {isCluster ? (
                    <th className="whitespace-nowrap px-2 py-2 font-medium">Completion</th>
                  ) : (
                    <th className="whitespace-nowrap px-2 py-2 font-medium">Evidence Link</th>
                  )}
                  <th className="whitespace-nowrap px-2 py-2 font-medium">Evidence Owner</th>
                  {!isCluster && (
                    <th className="whitespace-nowrap px-2 py-2 font-medium">Evidence Note</th>
                  )}
                  <th className="whitespace-nowrap px-2 py-2 font-medium">Capturing Method</th>
                  {!isCluster && (
                    <>
                      <th className="whitespace-nowrap px-2 py-2 font-medium">Enroll Id</th>
                      <th className="whitespace-nowrap px-2 py-2 font-medium">Time</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.sl} className="border-b border-line-soft align-top">
                    <td className="px-2 py-2 font-mono text-ink">{r.sl}</td>
                    <td className="px-2 py-2">
                      <span style={{ color: PERSPECTIVE_COLOR[r.perspective] }}>
                        {r.perspective}
                      </span>
                    </td>
                    <td className="max-w-[180px] px-2 py-2 text-ink">{r.strategic_goal}</td>
                    <td className="max-w-[200px] px-2 py-2 text-ink">{r.name}</td>
                    <td className="px-2 py-2 font-mono text-muted">{Number(r.weight_pct)}%</td>
                    <td className="whitespace-nowrap px-2 py-2 text-muted">
                      {r.direction === 'higher_better' ? 'Higher Better' : 'Lower Better'}
                    </td>
                    <td className="max-w-[180px] px-2 py-2 text-muted">{r.industry_benchmark}</td>
                    <td className="px-2 py-2 text-muted">{r.uom}</td>
                    {isCluster ? (
                      <>
                        <td className="whitespace-nowrap px-2 py-2 font-mono text-muted">
                          {r.clusterGoal !== null && r.clusterGoal !== undefined
                            ? `${r.clusterGoal} ${r.goalUom}`
                            : '—'}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2 font-mono text-ink">
                          {r.sumTarget !== undefined ? r.sumTarget.toFixed(1) : '—'}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2 font-mono text-ink">
                          {r.sumAchievement !== undefined ? r.sumAchievement.toFixed(1) : '—'}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="whitespace-nowrap px-2 py-2 font-mono text-ink">
                          {r.target_value ?? '—'}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2 font-mono text-ink">
                          {r.achievement_value ?? '—'}
                        </td>
                      </>
                    )}
                    <td className="whitespace-nowrap px-2 py-2 font-mono text-ink">
                      <span className="inline-flex items-center gap-1.5">
                        <StatusDot
                          pct={
                            r.achievement_pct !== null && r.achievement_pct !== undefined
                              ? Number(r.achievement_pct)
                              : null
                          }
                        />
                        {r.achievement_pct !== null && r.achievement_pct !== undefined
                          ? `${Number(r.achievement_pct).toFixed(1)}%`
                          : '—'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 font-mono text-gold">
                      {r.weighted_score !== null && r.weighted_score !== undefined
                        ? Number(r.weighted_score).toFixed(2)
                        : '—'}
                    </td>
                    <td className="max-w-[180px] px-2 py-2 text-muted">{r.target_validation}</td>
                    <td className="max-w-[200px] px-2 py-2 text-muted">{r.kpi_driver}</td>
                    <td className="max-w-[240px] px-2 py-2 font-mono text-[11px] text-muted-2">
                      {r.measurement_criteria}
                    </td>
                    <td className="max-w-[160px] px-2 py-2 text-muted">{r.data_source}</td>
                    <td className="whitespace-nowrap px-2 py-2 text-muted">{r.frequency}</td>
                    <td className="whitespace-nowrap px-2 py-2 text-muted">{r.evidence_type}</td>
                    {isCluster ? (
                      <td className="whitespace-nowrap px-2 py-2 font-mono text-muted">
                        {r.entryCount ?? 0}/{r.totalSbus ?? 0} SBUs
                      </td>
                    ) : (
                      <td className="max-w-[160px] break-words px-2 py-2 text-muted">
                        {r.evidence_link || '—'}
                      </td>
                    )}
                    <td className="whitespace-nowrap px-2 py-2 text-muted">{r.evidence_owner_role}</td>
                    {!isCluster && (
                      <td className="max-w-[180px] px-2 py-2 text-muted">{r.evidence_note || '—'}</td>
                    )}
                    <td className="whitespace-nowrap px-2 py-2 text-muted">{r.capturing_method}</td>
                    {!isCluster && (
                      <>
                        <td className="whitespace-nowrap px-2 py-2 font-mono text-ink">
                          {r.entered_by_enroll || '—'}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2 font-mono text-muted">
                          {r.updated_at ? new Date(r.updated_at).toLocaleString() : '—'}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
