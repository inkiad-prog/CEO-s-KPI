import { pool } from '@/lib/db';
import { KpiEntryBoxes } from './KpiEntryBoxes';

export default async function KpiEntryPage({
  searchParams,
}: {
  searchParams: Promise<{
    role?: string;
    sbuId?: string;
    month?: string;
    enroll?: string;
  }>;
}) {
  const { role, sbuId, month, enroll } = await searchParams;

  if (!role || !sbuId || !month || !enroll) {
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

  const { rows } = await pool.query<{ name: string }>(
    'SELECT name FROM sbus WHERE id = $1',
    [sbuId]
  );
  const sbuName = rows[0]?.name ?? 'Unknown SBU';

  return (
    <KpiEntryBoxes
      role={role}
      sbuId={sbuId}
      sbuName={sbuName}
      month={month}
      enrollNumber={enroll}
    />
  );
}
