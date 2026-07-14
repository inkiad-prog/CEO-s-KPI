import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { requireDashboardAdmin } from '@/lib/auth';
import { monthToDate } from '@/lib/kpi';

export async function GET(req: NextRequest) {
  const month = req.nextUrl.searchParams.get('month');
  if (!month) {
    return NextResponse.json({ error: 'month is required' }, { status: 400 });
  }

  const { rows } = await pool.query(
    `SELECT
       k.id, k.sl, k.perspective, k.name, k.weight_pct, k.direction, k.uom,
       g.target_value, g.is_locked, g.locked_by_enroll, g.locked_at
     FROM kpis k
     LEFT JOIN kpi_cluster_goals g ON g.kpi_id = k.id AND g.month = $1
     ORDER BY k.sl`,
    [monthToDate(month)]
  );

  // This page is entirely about setting the cluster goal, and Revenue's goal
  // is a % budget-achievement benchmark even though its per-SBU target/achievement
  // entries are in BDT, per guideline.
  const kpis = rows.map((k) => (k.sl === 1 ? { ...k, uom: '%' } : k));

  return NextResponse.json({ kpis });
}

export async function POST(req: NextRequest) {
  const adminEnroll = await requireDashboardAdmin();
  if (!adminEnroll) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  const { month, goals } = await req.json();
  if (!month || !Array.isArray(goals) || goals.length === 0) {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
  }
  const monthDate = monthToDate(month);

  const kpiIds: number[] = [];
  const targetValues: number[] = [];
  for (const g of goals) {
    const targetValue = Number(g.targetValue);
    if (!Number.isFinite(targetValue) || targetValue <= 0) continue;
    kpiIds.push(g.kpiId);
    targetValues.push(targetValue);
  }

  if (kpiIds.length === 0) {
    return NextResponse.json({ error: 'No valid goal values.' }, { status: 400 });
  }

  await pool.query(
    `INSERT INTO kpi_cluster_goals (kpi_id, month, target_value, is_locked, locked_by_enroll, locked_at)
     SELECT u.kpi_id, $3::date, u.target_value, true, $4, now()
     FROM unnest($1::int[], $2::numeric[]) AS u(kpi_id, target_value)
     ON CONFLICT (kpi_id, month)
     DO UPDATE SET target_value = excluded.target_value, is_locked = true,
       locked_by_enroll = excluded.locked_by_enroll, locked_at = now()`,
    [kpiIds, targetValues, monthDate, adminEnroll]
  );

  return NextResponse.json({ ok: true });
}
