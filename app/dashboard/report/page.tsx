import { redirect } from 'next/navigation';
import { pool } from '@/lib/db';
import { requireDashboardAdmin } from '@/lib/auth';
import { ReportClient } from './ReportClient';

export default async function DashboardReport({
  searchParams,
}: {
  searchParams: Promise<{ sbuId?: string; month?: string }>;
}) {
  const enrollNumber = await requireDashboardAdmin();
  if (!enrollNumber) {
    redirect('/dashboard');
  }

  const { sbuId, month } = await searchParams;

  const { rows: sbus } = await pool.query<{ id: number; name: string }>(
    'SELECT id, name FROM sbus ORDER BY sort_order'
  );

  return (
    <ReportClient
      enrollNumber={enrollNumber}
      sbus={sbus}
      initialSbuId={sbuId ?? ''}
      initialMonth={month ?? ''}
    />
  );
}
