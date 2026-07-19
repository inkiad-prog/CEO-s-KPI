import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { requireDashboardAdmin } from '@/lib/auth';
import { PERSPECTIVES, monthToDate } from '@/lib/kpi';

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
    'SELECT finalized_by_enroll, finalized_at FROM month_finalizations_simple WHERE month = $1',
    [monthDate]
  );
  if (existing.length > 0) {
    return NextResponse.json({ ok: true, finalized: existing[0] });
  }

  const { rows: submitted } = await pool.query(
    'SELECT DISTINCT perspective FROM kpi_submissions_simple WHERE month = $1',
    [monthDate]
  );
  const allComplete = submitted.length >= PERSPECTIVES.length;

  if (!allComplete) {
    return NextResponse.json(
      { error: 'Not every perspective has been submitted for this month yet.' },
      { status: 409 }
    );
  }

  const { rows } = await pool.query(
    `INSERT INTO month_finalizations_simple (month, finalized_by_enroll)
     VALUES ($1, $2)
     RETURNING finalized_by_enroll, finalized_at`,
    [monthDate, adminEnroll]
  );

  return NextResponse.json({ ok: true, finalized: rows[0] });
}
