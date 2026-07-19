'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BrandMark } from '@/components/BrandMark';
import { WarningIcon } from '@/components/icons';
import { ENROLL_HINT, isValidEnroll } from '@/lib/kpi';

export function KpiEntryForm() {
  const router = useRouter();
  const [enrollNumber, setEnrollNumber] = useState('');
  const [enrollError, setEnrollError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidEnroll(enrollNumber)) {
      setEnrollError(ENROLL_HINT);
      return;
    }
    const params = new URLSearchParams({ enroll: enrollNumber });
    router.push(`/kpi/entry?${params.toString()}`);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-6">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-6 inline-block text-sm text-muted transition-colors hover:text-gold"
        >
          ← Back
        </Link>

        <div className="mb-6 flex flex-col items-center text-center">
          <BrandMark size="md" />
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-gold">
            KPI intake
          </p>
          <h1 className="mt-1 font-display text-2xl uppercase tracking-wide text-ink">
            Enter KPI
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-line bg-surface-2 p-8"
        >
          <p className="text-sm text-muted">
            Enter your enroll number to continue.
          </p>

          <label
            htmlFor="enroll"
            className="mt-6 block text-sm font-medium text-ink"
          >
            Enroll number
          </label>
          <input
            id="enroll"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            maxLength={6}
            value={enrollNumber}
            onChange={(e) => {
              setEnrollNumber(e.target.value.replace(/\D/g, '').slice(0, 6));
              setEnrollError(null);
            }}
            aria-invalid={enrollError ? true : undefined}
            className={`mt-2 w-full rounded-lg border bg-surface px-4 py-2.5 font-mono text-ink outline-none transition-colors focus:border-gold ${
              enrollError ? 'border-status-risk' : 'border-line'
            }`}
            placeholder="e.g. 512345"
            required
          />

          {enrollError && (
            <p role="alert" className="mt-3 flex items-center gap-1.5 text-sm text-status-risk">
              <WarningIcon className="h-4 w-4 shrink-0" />
              {enrollError}
            </p>
          )}

          <button
            type="submit"
            className="mt-6 w-full rounded-lg bg-gold py-2.5 font-semibold text-[color:var(--color-on-gold)] transition-opacity hover:opacity-90"
          >
            Continue
          </button>
        </form>
      </div>
    </main>
  );
}
