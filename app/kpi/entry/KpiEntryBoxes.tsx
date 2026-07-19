'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BrandMark } from '@/components/BrandMark';
import { Skeleton } from '@/components/Skeleton';
import { StatusDot } from '@/components/StatusDot';
import { CompassIcon, WarningIcon } from '@/components/icons';
import {
  PERSPECTIVE_COLOR,
  STATUS_COLOR,
  achievementPct,
  examplePlaceholder,
  monthLabel,
  statusTier,
  type Direction,
  type Perspective,
} from '@/lib/kpi';

type KpiRow = {
  id: number;
  sl: number;
  perspective: Perspective;
  strategic_goal: string;
  name: string;
  weight_pct: string;
  direction: Direction;
  industry_benchmark: string;
  uom: string;
  target_validation: string;
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
};

type ContextResponse = {
  locked: boolean;
  submission: { submitted_by_enroll: string; submitted_at: string } | null;
  kpis: KpiRow[];
};

type Draft = {
  targetValue: string;
  achievementValue: string;
  evidenceLink: string;
  evidenceType: string;
  dataSource: string;
  evidenceOwner: string;
};

const emptyDraft: Draft = {
  targetValue: '',
  achievementValue: '',
  evidenceLink: '',
  evidenceType: '',
  dataSource: '',
  evidenceOwner: '',
};

export function KpiEntryBoxes({
  perspective,
  month,
  enrollNumber,
}: {
  perspective: Perspective;
  month: string;
  enrollNumber: string;
}) {
  const [data, setData] = useState<ContextResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/kpi/context-simple?perspective=${encodeURIComponent(perspective)}&month=${month}`)
      .then((res) => res.json())
      .then((json: ContextResponse) => {
        setData(json);
        const nextDrafts: Record<number, Draft> = {};
        for (const k of json.kpis) {
          nextDrafts[k.id] = {
            targetValue: k.target_value ?? '',
            achievementValue: k.achievement_value ?? '',
            evidenceLink: k.evidence_link ?? '',
            evidenceType: k.evidence_type ?? '',
            dataSource: k.data_source ?? '',
            evidenceOwner: k.evidence_owner ?? '',
          };
        }
        setDrafts(nextDrafts);
        setLoading(false);
      });
  }, [perspective, month]);

  function missingFields(draft: Draft) {
    return {
      targetValue: draft.targetValue === '' || !Number.isFinite(Number(draft.targetValue)),
      achievementValue: draft.achievementValue === '' || !Number.isFinite(Number(draft.achievementValue)),
      evidenceLink: draft.evidenceLink.trim() === '',
      evidenceType: draft.evidenceType.trim() === '',
      dataSource: draft.dataSource.trim() === '',
      evidenceOwner: draft.evidenceOwner.trim() === '',
    };
  }

  const allFilled = useMemo(
    () =>
      data
        ? data.kpis.every((k) => {
            const d = drafts[k.id] ?? emptyDraft;
            const missing = missingFields(d);
            return Object.values(missing).every((v) => !v);
          })
        : false,
    [data, drafts]
  );

  function updateDraft(kpiId: number, patch: Partial<Draft>) {
    setDrafts((d) => ({ ...d, [kpiId]: { ...d[kpiId], ...patch } }));
  }

  async function handleSubmit() {
    if (!data) return;
    setAttemptedSubmit(true);
    setError(null);
    if (!allFilled) {
      setError('Every box is required — fill in the highlighted fields before submitting.');
      return;
    }
    setSubmitting(true);
    const entries = data.kpis.map((k) => ({
      kpiId: k.id,
      targetValue: Number(drafts[k.id]?.targetValue),
      achievementValue: Number(drafts[k.id]?.achievementValue),
      evidenceLink: drafts[k.id]?.evidenceLink ?? '',
      evidenceType: drafts[k.id]?.evidenceType ?? '',
      dataSource: drafts[k.id]?.dataSource ?? '',
      evidenceOwner: drafts[k.id]?.evidenceOwner ?? '',
    }));
    const res = await fetch('/api/kpi/submit-simple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ perspective, month, enrollNumber, entries }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(json.error ?? 'Could not submit.');
      return;
    }
    const refreshed = await fetch(
      `/api/kpi/context-simple?perspective=${encodeURIComponent(perspective)}&month=${month}`
    ).then((r) => r.json());
    setData(refreshed);
  }

  const perspColor = PERSPECTIVE_COLOR[perspective];

  return (
    <main className="min-h-screen bg-bg px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/kpi"
            className="text-sm text-muted transition-colors hover:text-gold"
          >
            ← Back
          </Link>
          <span className="font-mono text-xs text-muted">
            Enroll {enrollNumber}
          </span>
        </div>

        <div className="mb-8 flex items-center gap-4 border-b border-line pb-6">
          <BrandMark />
          <div>
            <p
              className="font-mono text-[11px] uppercase tracking-[0.2em]"
              style={{ color: perspColor }}
            >
              {monthLabel(month)}
            </p>
            <h1 className="font-display text-2xl uppercase tracking-wide text-ink">
              {perspective}
            </h1>
          </div>
        </div>

        {loading || !data ? (
          <div className="space-y-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-line bg-surface-2 p-6">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="mt-3 h-5 w-2/3" />
                <Skeleton className="mt-2 h-3 w-full" />
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : data.locked ? (
          <div className="mb-6 rounded-lg border border-status-good bg-status-good-bg px-5 py-4 text-sm text-status-good">
            Submitted by {data.submission?.submitted_by_enroll} on{' '}
            {data.submission &&
              new Date(data.submission.submitted_at).toLocaleString()}
            . This submission is locked and can no longer be edited.
          </div>
        ) : null}

        <div className="space-y-5">
          {data?.kpis.map((k) => {
            const draft = drafts[k.id] ?? emptyDraft;
            const target = Number(draft.targetValue);
            const actual = Number(draft.achievementValue);
            const livePct =
              !data.locked && draft.targetValue !== '' && draft.achievementValue !== ''
                ? achievementPct(actual, target, k.direction)
                : data.locked && k.achievement_pct !== null
                  ? Number(k.achievement_pct)
                  : null;
            const missing = attemptedSubmit && !data.locked ? missingFields(draft) : null;

            return (
              <div
                key={k.id}
                className="rounded-lg border border-line bg-surface-2 p-6"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center rounded-full border border-line bg-surface px-2.5 py-0.5 font-mono text-[11px]"
                    style={{ color: perspColor }}
                  >
                    SL {String(k.sl).padStart(2, '0')}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-line bg-surface px-2.5 py-0.5 font-mono text-[11px] text-muted">
                    Weight {Number(k.weight_pct)}%
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted">{k.strategic_goal}</p>
                <h2 className="mt-1 font-display text-lg text-ink">{k.name}</h2>
                {k.kpi_driver && (
                  <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-2">
                    <CompassIcon className="h-3.5 w-3.5 shrink-0 text-gold" />
                    {k.kpi_driver}
                  </p>
                )}

                {/* Target + Achievement + live % */}
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div>
                    <label
                      htmlFor={`target-${k.id}`}
                      className="block truncate text-xs text-muted"
                      title={k.target_validation || undefined}
                    >
                      Target{' '}
                      {k.target_validation && (
                        <span className="text-muted-2">({k.target_validation})</span>
                      )}{' '}
                      <span className="text-status-risk">*</span>
                    </label>
                    {data.locked ? (
                      <span className="mt-0.5 block font-mono text-base font-semibold text-ink">
                        {k.target_value} {k.uom}
                      </span>
                    ) : (
                      <>
                        <div className="relative mt-1">
                          <input
                            id={`target-${k.id}`}
                            type="number"
                            step="any"
                            value={draft.targetValue}
                            onChange={(e) =>
                              updateDraft(k.id, { targetValue: e.target.value })
                            }
                            onWheel={(e) => e.currentTarget.blur()}
                            placeholder={examplePlaceholder(k.uom)}
                            aria-invalid={missing?.targetValue ? true : undefined}
                            className={`w-full rounded-lg border bg-surface py-1.5 pl-2.5 pr-12 font-mono text-base font-semibold text-ink outline-none focus:border-gold ${
                              missing?.targetValue ? 'border-status-risk' : 'border-line'
                            }`}
                          />
                          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-xs text-muted">
                            {k.uom}
                          </span>
                        </div>
                        {missing?.targetValue && (
                          <p className="mt-1 flex items-center gap-1 text-[11px] text-status-risk">
                            <WarningIcon className="h-3 w-3 shrink-0" />
                            Required
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor={`achievement-${k.id}`}
                      className="block text-xs text-muted"
                    >
                      Achievement ({k.uom}) <span className="text-status-risk">*</span>
                    </label>
                    {data.locked ? (
                      <span className="mt-0.5 block font-mono text-base font-semibold text-ink">
                        {k.achievement_value} {k.uom}
                      </span>
                    ) : (
                      <>
                        <div className="relative mt-1">
                          <input
                            id={`achievement-${k.id}`}
                            type="number"
                            step="any"
                            value={draft.achievementValue}
                            onChange={(e) =>
                              updateDraft(k.id, { achievementValue: e.target.value })
                            }
                            onWheel={(e) => e.currentTarget.blur()}
                            placeholder={examplePlaceholder(k.uom)}
                            aria-invalid={missing?.achievementValue ? true : undefined}
                            className={`w-full rounded-lg border bg-surface py-1.5 pl-2.5 pr-12 font-mono text-base font-semibold text-ink outline-none focus:border-gold ${
                              missing?.achievementValue ? 'border-status-risk' : 'border-line'
                            }`}
                          />
                          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-xs text-muted">
                            {k.uom}
                          </span>
                        </div>
                        {missing?.achievementValue && (
                          <p className="mt-1 flex items-center gap-1 text-[11px] text-status-risk">
                            <WarningIcon className="h-3 w-3 shrink-0" />
                            Required
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  <div>
                    <span className="block text-xs text-muted">Achievement %</span>
                    <span
                      className="mt-1 flex items-center gap-1.5 font-mono text-base font-semibold"
                      style={{ color: STATUS_COLOR[statusTier(livePct)] }}
                    >
                      <StatusDot pct={livePct} />
                      {livePct !== null ? `${livePct.toFixed(1)}%` : '—'}
                    </span>
                  </div>
                </div>

                {/* Evidence + evidence type + data source + evidence owner */}
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor={`evidence-${k.id}`}
                      className="block truncate text-xs text-muted"
                      title={k.required_evidence || undefined}
                    >
                      Evidence{' '}
                      {k.required_evidence && (
                        <span className="text-muted-2">({k.required_evidence})</span>
                      )}{' '}
                      <span className="text-status-risk">*</span>
                    </label>
                    {data.locked ? (
                      <p className="mt-1 break-words text-sm text-muted">
                        {k.evidence_link || '—'}
                      </p>
                    ) : (
                      <>
                        <input
                          id={`evidence-${k.id}`}
                          type="text"
                          value={draft.evidenceLink}
                          onChange={(e) =>
                            updateDraft(k.id, { evidenceLink: e.target.value })
                          }
                          placeholder="Link or reference to the evidence"
                          aria-invalid={missing?.evidenceLink ? true : undefined}
                          className={`mt-1 w-full rounded-lg border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold ${
                            missing?.evidenceLink ? 'border-status-risk' : 'border-line'
                          }`}
                        />
                        {missing?.evidenceLink && (
                          <p className="mt-1 flex items-center gap-1 text-[11px] text-status-risk">
                            <WarningIcon className="h-3 w-3 shrink-0" />
                            Required
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor={`evidence-type-${k.id}`}
                      className="block text-xs text-muted"
                    >
                      Evidence type <span className="text-status-risk">*</span>
                    </label>
                    {data.locked ? (
                      <p className="mt-1 break-words text-sm text-muted">
                        {k.evidence_type || '—'}
                      </p>
                    ) : (
                      <>
                        <input
                          id={`evidence-type-${k.id}`}
                          type="text"
                          value={draft.evidenceType}
                          onChange={(e) =>
                            updateDraft(k.id, { evidenceType: e.target.value })
                          }
                          placeholder="e.g. Report, Document, Dashboard"
                          aria-invalid={missing?.evidenceType ? true : undefined}
                          className={`mt-1 w-full rounded-lg border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold ${
                            missing?.evidenceType ? 'border-status-risk' : 'border-line'
                          }`}
                        />
                        {missing?.evidenceType && (
                          <p className="mt-1 flex items-center gap-1 text-[11px] text-status-risk">
                            <WarningIcon className="h-3 w-3 shrink-0" />
                            Required
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor={`data-source-${k.id}`}
                      className="block text-xs text-muted"
                    >
                      Data source <span className="text-status-risk">*</span>
                    </label>
                    {data.locked ? (
                      <p className="mt-1 break-words text-sm text-muted">
                        {k.data_source || '—'}
                      </p>
                    ) : (
                      <>
                        <input
                          id={`data-source-${k.id}`}
                          type="text"
                          value={draft.dataSource}
                          onChange={(e) =>
                            updateDraft(k.id, { dataSource: e.target.value })
                          }
                          placeholder="e.g. ERP/MIS/Finance Report"
                          aria-invalid={missing?.dataSource ? true : undefined}
                          className={`mt-1 w-full rounded-lg border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold ${
                            missing?.dataSource ? 'border-status-risk' : 'border-line'
                          }`}
                        />
                        {missing?.dataSource && (
                          <p className="mt-1 flex items-center gap-1 text-[11px] text-status-risk">
                            <WarningIcon className="h-3 w-3 shrink-0" />
                            Required
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor={`evidence-owner-${k.id}`}
                      className="block text-xs text-muted"
                    >
                      Evidence owner <span className="text-status-risk">*</span>
                    </label>
                    {data.locked ? (
                      <p className="mt-1 break-words text-sm text-muted">
                        {k.evidence_owner || '—'}
                      </p>
                    ) : (
                      <>
                        <input
                          id={`evidence-owner-${k.id}`}
                          type="text"
                          value={draft.evidenceOwner}
                          onChange={(e) =>
                            updateDraft(k.id, { evidenceOwner: e.target.value })
                          }
                          placeholder="Who owns this evidence"
                          aria-invalid={missing?.evidenceOwner ? true : undefined}
                          className={`mt-1 w-full rounded-lg border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold ${
                            missing?.evidenceOwner ? 'border-status-risk' : 'border-line'
                          }`}
                        />
                        {missing?.evidenceOwner && (
                          <p className="mt-1 flex items-center gap-1 text-[11px] text-status-risk">
                            <WarningIcon className="h-3 w-3 shrink-0" />
                            Required
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {data && !data.locked && (
          <div className="mt-8">
            {error && (
              <p role="alert" className="mb-3 flex items-center gap-1.5 text-sm text-status-risk">
                <WarningIcon className="h-4 w-4 shrink-0" />
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full rounded-lg bg-gold py-3 text-sm font-semibold text-[color:var(--color-on-gold)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:px-8"
            >
              {submitting ? 'Submitting…' : 'Submit & lock this month'}
            </button>
            <p className="mt-2 text-xs text-muted">
              Once submitted, these values are locked and cannot be edited.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
