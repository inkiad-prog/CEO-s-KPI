import { cookies } from 'next/headers';
import { pool } from './db';

export const DASHBOARD_COOKIE = 'ceo_kpi_dashboard_enroll';

export async function getDashboardEnroll(): Promise<string | null> {
  const store = await cookies();
  return store.get(DASHBOARD_COOKIE)?.value ?? null;
}

export async function requireDashboardAdmin(): Promise<string | null> {
  const enroll = await getDashboardEnroll();
  if (!enroll) return null;
  const result = await pool.query(
    'SELECT enroll_number FROM dashboard_admins WHERE enroll_number = $1',
    [enroll]
  );
  return result.rowCount ? enroll : null;
}
