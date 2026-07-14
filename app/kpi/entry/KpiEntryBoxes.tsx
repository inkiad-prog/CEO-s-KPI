'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BrandMark } from '@/components/BrandMark';
import { Skeleton } from '@/components/Skeleton';
import { StatusDot } from '@/components/StatusDot';
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
  kpi_driver: string;
  measurement_criteria: string;
  data_source: string;
  frequency: string;
  evidence_type: string;
  evidence_link_label: string;
  required_evidence: string;
  capturing_method: string;
  target_value: string | null;
  achievement_value: string | null;
  achievement_pct: string | null;
  weighted_score: string | null;
  evidence_link: string | null;
  evidence_note: string | null;
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
  evidenceNote: string;
};

export function KpiEntryBoxes({
  role,
  sbuId,
  sbuName,
  month,
  enrollNumber,
}: {
  role: string;
  sbuId: string;
  sbuName: string;
  month: string;
  enrollNumber: string;
}) {
  const [data, setData] = useState<ContextResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/kpi/context?role=${encodeURIComponent(role)}&sbuId=${sbuId}&month=${month}`)
      .then((res) => res.json())
      .then((json: ContextResponse) => {
        setData(json);
        const nextDrafts: Record<number, Draft> = {};
        for (const k of json.kpis) {
          nextDrafts[k.id] = {
            targetValue: k.target_value ?? '',
            achievementValue: k.achievement_value ?? '',
            evidenceLink: k.evidence_link ?? '',
            evidenceNote: k.evidence_note ?? '',
          };
        }
        setDrafts(nextDrafts);
        setLoading(false);
      });
  }, [role, sbuId, month]);

  const allFilled = useMemo(
    () =>
      data
        ? data.kpis.every((k) => {
            const d = drafts[k.id];
            return (
              d &&
              d.targetValue !== '' &&
              Number.isFinite(Number(d.targetValue)) &&
              d.achievementValue !== '' &&
              Number.isFinite(Number(d.achievementValue))
            );
          })
        : false,
    [data, drafts]
  );

  function updateDraft(kpiId: number, patch: Partial<Draft>) {
    setDrafts((d) => ({ ...d, [kpiId]: { ...d[kpiId], ...patch } }));
  }

  async function handleSubmit() {
    if (!data) return;
    setSubmitting(true);
    setError(null);
    const entries = data.kpis.map((k) => ({
      kpiId: k.id,
      targetValue: Number(drafts[k.id]?.targetValue),
      achievementValue: Number(drafts[k.id]?.achievementValue),
      evidenceLink: drafts[k.id]?.evidenceLink ?? '',
      evidenceNote: drafts[k.id]?.evidenceNote ?? '',
    }));
    const res = await fetch('/api/kpi/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, sbuId, month, enrollNumber, entries }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(json.error ?? 'Could not submit.');
      return;
    }
    const refreshed = await fetch(
      `/api/kpi/context?role=${encodeURIComponent(role)}&sbuId=${sbuId}&month=${month}`
    ).then((r) => r.json());
    setData(refreshed);
  }

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
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold">
              {monthLabel(month)}
            </p>
            <h1 className="font-display text-2xl uppercase tracking-wide text-ink">
              {role} · {sbuName}
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
            const draft = drafts[k.id] ?? {
              targetValue: '',
              achievementValue: '',
              evidenceLink: '',
              evidenceNote: '',
            };
            const target = Number(draft.targetValue);
            const actual = Number(draft.achievementValue);
            const livePct =
              !data.locked && draft.targetValue !== '' && draft.achievementValue !== ''
                ? achievementPct(actual, target, k.direction)
                : data.locked && k.achievement_pct !== null
                  ? Number(k.achievement_pct)
                  : null;
            const perspColor = PERSPECTIVE_COLOR[k.perspective];

            return (
              <div
                key={k.id}
                className="rounded-lg border border-line bg-surface-2 p-6"
              >
                <div>
                  <div className="mb-1.5 flex items-center gap-2">
                      <span
                        className="inline-flex items-center rounded-full border border-line bg-surface px-2.5 py-0.5 font-mono text-[11px]"
                        style={{ color: perspColor }}
                      >
                        SL {String(k.sl).padStart(2, '0')} · {k.perspective}
                      </span>
                      <span className="font-mono text-[11px] text-muted">
                        Weight {Number(k.weight_pct)}%
                      </span>
                    </div>
                    <p className="text-xs text-muted">{k.strategic_goal}</p>
                    <h2 className="mt-1 font-display text-lg text-ink">
                      {k.name}
                    </h2>
                    <p className="mt-1 font-mono text-[11px] leading-relaxed text-muted-2">
                      {k.measurement_criteria}
                    </p>
                    {k.industry_benchmark && (
                      <p className="mt-1 text-[11px] text-muted">
                        Benchmark: {k.industry_benchmark}
                      </p>
                    )}

                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <div>
                        <label
                          htmlFor={`target-${k.id}`}
                          className="block text-xs text-muted"
                        >
                          Target ({k.uom} ·{' '}
                          {k.direction === 'higher_better'
                            ? 'higher better'
                            : 'lower better'}
                          )
                        </label>
                        {data.locked ? (
                          <span className="mt-0.5 block font-mono text-base font-semibold text-ink">
                            {k.target_value} {k.uom}
                          </span>
                        ) : (
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
                              className="w-full rounded-lg border border-line bg-surface py-1.5 pl-2.5 pr-12 font-mono text-base font-semibold text-ink outline-none focus:border-gold"
                            />
                            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-xs text-muted">
                              {k.uom}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <label
                          htmlFor={`achievement-${k.id}`}
                          className="block text-xs text-muted"
                        >
                          Achievement ({k.uom})
                        </label>
                        {data.locked ? (
                          <span className="mt-0.5 block font-mono text-base font-semibold text-ink">
                            {k.achievement_value} {k.uom}
                          </span>
                        ) : (
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
                              className="w-full rounded-lg border border-line bg-surface py-1.5 pl-2.5 pr-12 font-mono text-base font-semibold text-ink outline-none focus:border-gold"
                            />
                            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-xs text-muted">
                              {k.uom}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="block text-xs text-muted">
                          Achievement %
                        </span>
                        <span
                          className="mt-0.5 flex items-center gap-1.5 font-mono text-base font-semibold"
                          style={{ color: STATUS_COLOR[statusTier(livePct)] }}
                        >
                          <StatusDot pct={livePct} />
                          {livePct !== null ? `${livePct.toFixed(1)}%` : '—'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor={`evidence-link-${k.id}`}
                          className="block text-xs text-muted"
                        >
                          Evidence link / data source
                        </label>
                        {data.locked ? (
                          <p className="mt-1 break-words text-sm text-muted">
                            {k.evidence_link || '—'}
                          </p>
                        ) : (
                          <input
                            id={`evidence-link-${k.id}`}
                            type="text"
                            value={draft.evidenceLink}
                            onChange={(e) =>
                              updateDraft(k.id, { evidenceLink: e.target.value })
                            }
                            placeholder={`${k.data_source} — ${k.evidence_type}`}
                            className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold"
                          />
                        )}
                      </div>
                      <div>
                        <label
                          htmlFor={`evidence-note-${k.id}`}
                          className="block text-xs text-muted"
                        >
                          Evidence note
                        </label>
                        {data.locked ? (
                          <p className="mt-1 break-words text-sm text-muted">
                            {k.evidence_note || '—'}
                          </p>
                        ) : (
                          <input
                            id={`evidence-note-${k.id}`}
                            type="text"
                            value={draft.evidenceNote}
                            onChange={(e) =>
                              updateDraft(k.id, { evidenceNote: e.target.value })
                            }
                            placeholder={k.required_evidence}
                            className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold"
                          />
                        )}
                      </div>
                    </div>

                    <p className="mt-3 text-[11px] text-muted-2">
                      {k.frequency} · {k.capturing_method} · required
                      evidence: {k.required_evidence}
                    </p>
                </div>
              </div>
            );
          })}
        </div>

        {data && !data.locked && (
          <div className="mt-8">
            {error && (
              <p role="alert" className="mb-3 text-sm text-status-risk">
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!allFilled || submitting}
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
