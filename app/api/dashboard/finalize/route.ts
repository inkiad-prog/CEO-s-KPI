import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { requireDashboardAdmin } from '@/lib/auth';
import { monthToDate } from '@/lib/kpi';

const TOTAL_ROLES = 4;

export async function POST(req: NextRequest) {
  const adminEnroll = await requireDashboardAdmin();
  if (!adminEnroll) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  const { month } = await req.json();
  if (!month) {
    return NextResponse.json({ error: 'month is required' }, { status: 400 });
  }
  const monthDate = monthToDate(month);

  const { rows: existing } = await pool.query(
    'SELECT finalized_by_enroll, finalized_at FROM month_finalizations WHERE month = $1',
    [monthDate]
  );
  if (existing.length > 0) {
    return NextResponse.json({ ok: true, finalized: existing[0] });
  }

  const { rows: sbus } = await pool.query(
    `SELECT s.id,
       (SELECT COUNT(DISTINCT role) FROM kpi_submissions ks
        WHERE ks.sbu_id = s.id AND ks.month = $1)::int AS roles_submitted
     FROM sbus s`,
    [monthDate]
  );

  const allComplete =
    sbus.length > 0 &&
    sbus.every((s) => s.roles_submitted >= TOTAL_ROLES);

  if (!allComplete) {
    return NextResponse.json(
      { error: 'Not every SBU has completed all roles for this month yet.' },
      { status: 409 }
    );
  }

  const { rows } = await pool.query(
    `INSERT INTO month_finalizations (month, finalized_by_enroll)
     VALUES ($1, $2)
     RETURNING finalized_by_enroll, finalized_at`,
    [monthDate, adminEnroll]
  );

  return NextResponse.json({ ok: true, finalized: rows[0] });
}
