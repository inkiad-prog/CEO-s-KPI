'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BrandMark } from '@/components/BrandMark';
import { MONTHS, ROLES, currentMonthValue, type Role } from '@/lib/kpi';

export function KpiEntryForm({
  sbus,
}: {
  sbus: { id: number; name: string }[];
}) {
  const router = useRouter();
  const [role, setRole] = useState<Role | ''>('');
  const [sbuId, setSbuId] = useState('');
  const [month, setMonth] = useState(currentMonthValue);
  const [enrollNumber, setEnrollNumber] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({
      role,
      sbuId,
      month,
      enroll: enrollNumber,
    });
    router.push(`/kpi/entry?${params.toString()}`);
  }

  return (
    <main className="min-h-screen bg-bg px-6 py-12">
      <div className="mx-auto w-full max-w-lg">
        <Link
          href="/"
          className="mb-6 inline-block text-sm text-muted transition-colors hover:text-gold"
        >
          ← Back
        </Link>

        <div className="flex items-center gap-4">
          <BrandMark size="md" linked={false} />
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold">
              KPI intake
            </p>
            <h1 className="font-display text-3xl uppercase tracking-wide text-ink">
              Enter KPI
            </h1>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted">
          Select your SBU and function, then the reporting period.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-lg border border-line bg-surface-2 p-6"
        >
          <label
            htmlFor="sbu"
            className="mb-2 block text-xs font-medium text-muted"
          >
            1 · Select your SBU
          </label>
          <select
            id="sbu"
            required
            value={sbuId}
            onChange={(e) => setSbuId(e.target.value)}
            className="w-full rounded-lg border border-line bg-surface px-4 py-2.5 text-ink outline-none focus:border-gold"
          >
            <option value="" disabled>
              Choose an SBU…
            </option>
            {sbus.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <label
            htmlFor="role"
            className="mb-2 mt-6 block text-xs font-medium text-muted"
          >
            2 · Select your function
          </label>
          <select
            id="role"
            required
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="w-full rounded-lg border border-line bg-surface px-4 py-2.5 text-ink outline-none focus:border-gold"
          >
            <option value="" disabled>
              Choose a function…
            </option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <div className="mt-5 grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="month"
                className="mb-2 block text-xs font-medium text-muted"
              >
                Reporting period
              </label>
              <select
                id="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full rounded-lg border border-line bg-surface px-4 py-2.5 text-ink outline-none focus:border-gold"
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="enroll"
                className="mb-2 block text-xs font-medium text-muted"
              >
                Your enroll number
              </label>
              <input
                id="enroll"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                required
                value={enrollNumber}
                onChange={(e) => setEnrollNumber(e.target.value)}
                className="w-full rounded-lg border border-line bg-surface px-4 py-2.5 text-ink outline-none focus:border-gold"
                placeholder="e.g. 512345"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!sbuId || !role}
            className="mt-7 w-full rounded-lg bg-gold py-2.5 font-semibold text-[color:var(--color-on-gold)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue
          </button>
        </form>
      </div>
    </main>
  );
}
