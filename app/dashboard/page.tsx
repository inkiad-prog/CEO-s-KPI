'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BrandMark } from '@/components/BrandMark';
import { WarningIcon } from '@/components/icons';
import { ENROLL_HINT, isValidEnroll } from '@/lib/kpi';

export default function DashboardGate() {
  const router = useRouter();
  const [enrollNumber, setEnrollNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isValidEnroll(enrollNumber)) {
      setError(ENROLL_HINT);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/dashboard/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollNumber }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Access denied.');
        setSubmitting(false);
        return;
      }
      router.push('/dashboard/home');
    } catch {
      setError('Something went wrong. Try again.');
      setSubmitting(false);
    }
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
          <BrandMark size="md" linked={false} />
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-gold">
            Cluster admin
          </p>
          <h1 className="mt-1 font-display text-2xl uppercase tracking-wide text-ink">
            Dashboard access
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
              setError(null);
            }}
            aria-invalid={error ? true : undefined}
            className={`mt-2 w-full rounded-lg border bg-surface px-4 py-2.5 font-mono text-ink outline-none transition-colors focus:border-gold ${
              error ? 'border-status-risk' : 'border-line'
            }`}
            placeholder="e.g. 565503"
            required
          />

          {error && (
            <p role="alert" className="mt-3 flex items-center gap-1.5 text-sm text-status-risk">
              <WarningIcon className="h-4 w-4 shrink-0" />
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-lg bg-gold py-2.5 font-semibold text-[color:var(--color-on-gold)] transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? 'Checking…' : 'Continue'}
          </button>
        </form>
      </div>
    </main>
  );
}
