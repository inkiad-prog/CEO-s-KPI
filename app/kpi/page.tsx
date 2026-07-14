import { pool } from '@/lib/db';
import { KpiEntryForm } from './KpiEntryForm';

export default async function KpiEntryStart() {
  const { rows: sbus } = await pool.query<{ id: number; name: string }>(
    'SELECT id, name FROM sbus ORDER BY sort_order'
  );

  return <KpiEntryForm sbus={sbus} />;
}
