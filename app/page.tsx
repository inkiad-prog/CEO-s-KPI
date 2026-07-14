import Link from 'next/link';
import { BrandMark } from '@/components/BrandMark';
import { DashboardIcon, PencilIcon } from '@/components/icons';

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-6 py-10">
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center text-center">
          <BrandMark size="lg" linked={false} priority />
          <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.2em] text-gold">
            Balanced scorecard · KPI intake &amp; rollup
          </p>
          <h1 className="mt-2 text-balance font-display text-5xl uppercase leading-[0.95] tracking-[-0.01em] text-ink sm:text-6xl">
            Cluster CEO KPI
          </h1>
          <p className="mt-4 max-w-sm text-pretty text-sm text-muted">
            The CEO&rsquo;s balanced scorecard for the Trading Cluster.
            <br />
            Enter this month&rsquo;s KPI actuals, or open the cluster dashboard.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Link
            href="/dashboard"
            className="group flex flex-col gap-4 rounded-lg border border-line bg-surface-2 p-7 text-left transition-all duration-200 ease-out hover:border-gold-dim hover:bg-surface-3 hover:shadow-[0_8px_24px_-10px_rgba(27,58,107,0.25)] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold-dim bg-bg text-gold transition-colors duration-200 group-hover:border-gold group-hover:text-gold-dark">
              <DashboardIcon className="h-5 w-5" />
            </span>
            <div>
              <span className="font-display text-xl uppercase tracking-wide text-ink">
                Dashboard
              </span>
              <p className="mt-1 text-xs leading-snug text-muted">
                Cluster rollup, SBU comparison, completion tracking
              </p>
            </div>
          </Link>
          <Link
            href="/kpi"
            className="group flex flex-col gap-4 rounded-lg border border-line bg-surface-2 p-7 text-left transition-all duration-200 ease-out hover:border-gold-dim hover:bg-surface-3 hover:shadow-[0_8px_24px_-10px_rgba(27,58,107,0.25)] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold-dim bg-bg text-gold transition-colors duration-200 group-hover:border-gold group-hover:text-gold-dark">
              <PencilIcon className="h-5 w-5" />
            </span>
            <div>
              <span className="font-display text-xl uppercase tracking-wide text-ink">
                Enter KPI
              </span>
              <p className="mt-1 text-xs leading-snug text-muted">
                Submit this month&rsquo;s actuals for your role
              </p>
            </div>
          </Link>
        </div>

        <p className="mt-10 text-center font-mono text-[11px] tracking-wide text-muted-2">
          CEO KPI · Trading Cluster · Confidential
        </p>
      </div>
    </main>
  );
}
