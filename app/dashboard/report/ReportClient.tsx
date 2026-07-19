'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { BrandMark } from '@/components/BrandMark';
import { Skeleton } from '@/components/Skeleton';
import { StatusDot } from '@/components/StatusDot';
import { MONTHS, PERSPECTIVE_COLOR, currentMonthValue, monthLabel, type Perspective } from '@/lib/kpi';
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
  frequency: string;
  required_evidence: string;
  target_value: string | null;
  achievement_value: string | null;
  achievement_pct: string | null;
  weighted_score: string | null;
  evidence_link: string | null;
  evidence_type: string | null;
  data_source: string | null;
  evidence_owner: string | null;
  entered_by_enroll: string | null;
  updated_at: string | null;
};

type Submission = { perspective: Perspective; submitted_by_enroll: string; submitted_at: string };

export function ReportClient({
  enrollNumber,
  initialMonth,
}: {
  enrollNumber: string;
  initialMonth: string;
}) {
  const [month, setMonth] = useState(initialMonth || currentMonthValue());
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/dashboard/report-simple?month=${month}`);
    const data = await res.json();
    setRows(data.rows ?? []);
    setSubmissions(data.submissions ?? []);
    setLoading(false);
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  const submittedByPerspective = new Map(submissions.map((s) => [s.perspective, s]));

  function handleExportExcel() {
    const headers = [
      'SL', 'Perspective', 'Strategic Goal', 'KPI', 'Weight', 'KPI Direction',
      'Industry Target Benchmark', 'UOM', 'Target', 'Achievement', '% Achievement',
      'Weighted Score', 'Target Validation', 'KPI Driver', 'Measurement Criteria',
      'Frequency', 'Required Evidence', 'Evidence Link', 'Evidence Type', 'Data Source',
      'Evidence Owner', 'Entered By', 'Entered At',
    ];

    const dataRows = rows.map((r, i) => [
      i + 1,
      r.perspective,
      r.strategic_goal,
      r.name,
      `${Number(r.weight_pct)}%`,
      r.direction === 'higher_better' ? 'Higher Better' : 'Lower Better',
      r.industry_benchmark,
      r.uom,
      r.target_value ?? '',
      r.achievement_value ?? '',
      r.achievement_pct !== null ? `${Number(r.achievement_pct).toFixed(1)}%` : '',
      r.weighted_score !== null ? Number(Number(r.weighted_score).toFixed(2)) : '',
      r.target_validation ?? '',
      r.kpi_driver,
      r.measurement_criteria,
      r.frequency,
      r.required_evidence,
      r.evidence_link ?? '',
      r.evidence_type ?? '',
      r.data_source ?? '',
      r.evidence_owner ?? '',
      r.entered_by_enroll ?? '',
      r.updated_at ? new Date(r.updated_at).toLocaleString() : '',
    ]);

    downloadExcel(`cluster_report_${month}.xlsx`, 'Report', [headers, ...dataRows]);
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
                Cluster — all perspectives
              </h1>
            </div>
          </div>

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
          <div className="mb-6 space-y-2.5 rounded-lg border border-line bg-surface-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        ) : (
          <section className="mb-6 rounded-lg border border-line bg-surface-2 p-4">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.15em] text-muted">
              Who has submitted
            </p>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              {(['Financial', 'Customer', 'Internal Process', 'Learning & Growth'] as const).map(
                (p) => {
                  const s = submittedByPerspective.get(p);
                  return (
                    <div
                      key={p}
                      className="rounded-md border border-line bg-surface px-3 py-2"
                    >
                      <p className="text-xs font-medium" style={{ color: PERSPECTIVE_COLOR[p] }}>
                        {p}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-muted">
                        {s
                          ? `${s.submitted_by_enroll} · ${new Date(s.submitted_at).toLocaleString()}`
                          : 'Not submitted'}
                      </p>
                    </div>
                  );
                }
              )}
            </div>
          </section>
        )}

        {loading ? (
          <div className="space-y-2.5 rounded-lg border border-line bg-surface-2 p-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-line bg-surface-2 p-4">
            <table className="w-full min-w-[2000px] border-collapse text-xs">
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
                  <th className="whitespace-nowrap px-2 py-2 font-medium">Target</th>
                  <th className="whitespace-nowrap px-2 py-2 font-medium">Achievement</th>
                  <th className="whitespace-nowrap px-2 py-2 font-medium">% Achievement</th>
                  <th className="whitespace-nowrap px-2 py-2 font-medium">Weighted Score</th>
                  <th className="whitespace-nowrap px-2 py-2 font-medium">Target Validation</th>
                  <th className="whitespace-nowrap px-2 py-2 font-medium">KPI Driver</th>
                  <th className="whitespace-nowrap px-2 py-2 font-medium">Measurement Criteria</th>
                  <th className="whitespace-nowrap px-2 py-2 font-medium">Frequency</th>
                  <th className="whitespace-nowrap px-2 py-2 font-medium">Required Evidence</th>
                  <th className="whitespace-nowrap px-2 py-2 font-medium">Evidence Link</th>
                  <th className="whitespace-nowrap px-2 py-2 font-medium">Evidence Type</th>
                  <th className="whitespace-nowrap px-2 py-2 font-medium">Data Source</th>
                  <th className="whitespace-nowrap px-2 py-2 font-medium">Evidence Owner</th>
                  <th className="whitespace-nowrap px-2 py-2 font-medium">Entered By</th>
                  <th className="whitespace-nowrap px-2 py-2 font-medium">Entered At</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.sl} className="border-b border-line-soft align-top">
                    <td className="px-2 py-2 font-mono text-ink">{i + 1}</td>
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
                    <td className="whitespace-nowrap px-2 py-2 font-mono text-ink">
                      {r.target_value ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 font-mono text-ink">
                      {r.achievement_value ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 font-mono text-ink">
                      <span className="inline-flex items-center gap-1.5">
                        <StatusDot pct={r.achievement_pct !== null ? Number(r.achievement_pct) : null} />
                        {r.achievement_pct !== null ? `${Number(r.achievement_pct).toFixed(1)}%` : '—'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 font-mono text-gold">
                      {r.weighted_score !== null ? Number(r.weighted_score).toFixed(2) : '—'}
                    </td>
                    <td className="max-w-[180px] px-2 py-2 text-muted">{r.target_validation}</td>
                    <td className="max-w-[200px] px-2 py-2 text-muted">{r.kpi_driver}</td>
                    <td className="max-w-[240px] px-2 py-2 font-mono text-[11px] text-muted-2">
                      {r.measurement_criteria}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-muted">{r.frequency}</td>
                    <td className="max-w-[180px] px-2 py-2 text-muted">{r.required_evidence}</td>
                    <td className="max-w-[160px] break-words px-2 py-2 text-muted">
                      {r.evidence_link || '—'}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-muted">{r.evidence_type || '—'}</td>
                    <td className="max-w-[160px] px-2 py-2 text-muted">{r.data_source || '—'}</td>
                    <td className="whitespace-nowrap px-2 py-2 text-muted">{r.evidence_owner || '—'}</td>
                    <td className="whitespace-nowrap px-2 py-2 font-mono text-ink">
                      {r.entered_by_enroll || '—'}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 font-mono text-muted">
                      {r.updated_at ? new Date(r.updated_at).toLocaleString() : '—'}
                    </td>
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
