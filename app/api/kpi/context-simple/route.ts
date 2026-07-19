import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { PERSPECTIVES, monthToDate } from '@/lib/kpi';

export async function GET(req: NextRequest) {
  const perspective = req.nextUrl.searchParams.get('perspective');
  const month = req.nextUrl.searchParams.get('month');

  if (!perspective || !month || !PERSPECTIVES.includes(perspective as (typeof PERSPECTIVES)[number])) {
    return NextResponse.json(
      { error: 'perspective and month are required' },
      { status: 400 }
    );
  }
  const monthDate = monthToDate(month);

  const { rows: submissionRows } = await pool.query(
    `SELECT id, submitted_by_enroll, submitted_at FROM kpi_submissions_simple
     WHERE perspective = $1 AND month = $2`,
    [perspective, monthDate]
  );
  const submission = submissionRows[0] ?? null;

  const { rows: kpis } = await pool.query(
    `SELECT
       k.id, k.sl, k.perspective, k.strategic_goal, k.name, k.weight_pct,
       k.direction, k.industry_benchmark, k.uom, k.target_validation, k.kpi_driver,
       k.measurement_criteria, k.frequency, k.required_evidence,
       e.target_value, e.achievement_value, e.achievement_pct, e.weighted_score,
       e.evidence_link, e.evidence_type, e.data_source, e.evidence_owner
     FROM kpis k
     JOIN kpi_simple_set s ON s.kpi_id = k.id
     LEFT JOIN kpi_entries_simple e
       ON e.kpi_id = k.id AND e.month = $2
     WHERE k.perspective = $1
     ORDER BY k.sl`,
    [perspective, monthDate]
  );

  return NextResponse.json({
    locked: !!submission,
    submission,
    kpis,
  });
}
