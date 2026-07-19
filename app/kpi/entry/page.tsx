import { KpiEntryBoxes } from './KpiEntryBoxes';
import type { Perspective } from '@/lib/kpi';

export default async function KpiEntryPage({
  searchParams,
}: {
  searchParams: Promise<{
    perspective?: string;
    month?: string;
    enroll?: string;
  }>;
}) {
  const { perspective, month, enroll } = await searchParams;

  if (!perspective || !month || !enroll) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg px-6">
        <p className="text-sm text-muted">
          Missing selection.{' '}
          <a href="/kpi" className="text-navy underline">
            Start over
          </a>
          .
        </p>
      </main>
    );
  }

  return (
    <KpiEntryBoxes
      perspective={perspective as Perspective}
      month={month}
      enrollNumber={enroll}
    />
  );
}
