'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { BrandMark } from '@/components/BrandMark';
import { Skeleton } from '@/components/Skeleton';
import { StatusDot } from '@/components/StatusDot';
import { MONTHS, PERSPECTIVE_COLOR, currentMonthValue, evidenceHref, monthLabel, type Perspective } from '@/lib/kpi';
import { downloadExcel, type Cell } from '@/lib/exportExcel';

type ReportRow = {
  kpi_id: number;
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

type PerspectiveStatus = {
  perspective: Perspective;
  submitted: boolean;
  submittedByEnroll: string | null;
  submittedAt: string | null;
};

type ApiResponse =
  | {
      finalized: false;
      perspectiveStatus: PerspectiveStatus[];
      completion: { perspectivesComplete: number; totalPerspectives: number };
    }
  | {
      finalized: { finalized_by_enroll: string; finalized_at: string };
      perspectiveStatus: PerspectiveStatus[];
      rows: ReportRow[];
    };

export function OverallReportClient({ enrollNumber }: { enrollNumber: string }) {
  const [month, setMonth] = useState(currentMonthValue);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/dashboard/overall-report-simple?month=${month}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  function handleExportExcel() {
    if (!data || !('rows' in data)) return;
    const headers = [
      'SL', 'Perspective', 'Strategic Goal', 'KPI', 'Weight', 'KPI Direction',
      'Industry Target Benchmark', 'UOM', 'Target', 'Achievement', 'Achievement %',
      'Weighted Score', 'Target Validation', 'KPI Driver',
      'Required Evidence', 'Evidence Type', 'Evidence Link', 'Evidence Owner',
      'Entered By', 'Entered At',
    ];

    const dataRows: Cell[][] = data.rows.map((r, i) => [
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
      r.required_evidence,
      r.evidence_type ?? '',
      r.evidence_link ?? '',
      r.evidence_owner ?? '',
      r.entered_by_enroll ?? '',
      r.updated_at ? new Date(r.updated_at).toLocaleString() : '',
    ]);

    downloadExcel(`overall_report_${month}.xlsx`, 'Overall Report', [headers, ...dataRows]);
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
                Cluster — full scorecard
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
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        ) : !('rows' in data) ? (
          <div className="rounded-lg border border-line bg-surface-2 p-6">
            <p className="text-sm text-ink">
              This report becomes available once every perspective has submitted
              for {monthLabel(month)} and the month is saved and closed on the
              Dashboard.
            </p>
            <p className="mt-2 font-mono text-xs text-muted">
              {data.completion.perspectivesComplete}/{data.completion.totalPerspectives} perspectives complete
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {data.perspectiveStatus.map((p) => (
                <span
                  key={p.perspective}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                    p.submitted
                      ? 'bg-status-good-bg text-status-good'
                      : 'bg-surface-3 text-muted'
                  }`}
                >
                  {p.submitted ? '✓' : '—'} {p.perspective}
                </span>
              ))}
            </div>
            <Link
              href="/dashboard/home"
              className="mt-6 inline-block text-sm text-gold transition-colors hover:text-gold-dark"
            >
              ← Go save and close the month
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-4 text-xs text-muted">
              Saved and closed by {data.finalized.finalized_by_enroll} on{' '}
              {new Date(data.finalized.finalized_at).toLocaleDateString()}
            </p>
            <div className="overflow-x-auto rounded-lg border border-line bg-surface-2 p-4">
              <table className="w-full min-w-[1800px] border-collapse text-xs">
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
                    <th className="whitespace-nowrap px-2 py-2 font-medium">Achievement %</th>
                    <th className="whitespace-nowrap px-2 py-2 font-medium">Weighted Score</th>
                    <th className="whitespace-nowrap px-2 py-2 font-medium">Target Validation</th>
                    <th className="whitespace-nowrap px-2 py-2 font-medium">KPI Driver</th>
                    <th className="whitespace-nowrap px-2 py-2 font-medium">Required Evidence</th>
                    <th className="whitespace-nowrap px-2 py-2 font-medium">Evidence Type</th>
                    <th className="whitespace-nowrap px-2 py-2 font-medium">Evidence Link</th>
                    <th className="whitespace-nowrap px-2 py-2 font-medium">Evidence Owner</th>
                    <th className="whitespace-nowrap px-2 py-2 font-medium">Entered By</th>
                    <th className="whitespace-nowrap px-2 py-2 font-medium">Entered At</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((r, i) => (
                    <tr key={r.kpi_id} className="border-b border-line-soft align-top">
                      <td className="px-2 py-2 font-mono text-ink">{i + 1}</td>
                      <td className="px-2 py-2">
                        <span style={{ color: PERSPECTIVE_COLOR[r.perspective] }}>{r.perspective}</span>
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
                      <td className="max-w-[160px] px-2 py-2 text-muted">{r.required_evidence}</td>
                      <td className="whitespace-nowrap px-2 py-2 text-muted">{r.evidence_type || '—'}</td>
                      <td className="max-w-[160px] break-words px-2 py-2 text-muted">
                        {evidenceHref(r.evidence_link) ? (
                          <a
                            href={evidenceHref(r.evidence_link)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gold underline transition-colors hover:text-gold-dark"
                          >
                            Link
                          </a>
                        ) : (
                          r.evidence_link || '—'
                        )}
                      </td>
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
          </>
        )}
      </div>
    </main>
  );
}
