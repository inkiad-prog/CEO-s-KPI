import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { monthToDate } from '@/lib/kpi';

export async function GET(req: NextRequest) {
  const role = req.nextUrl.searchParams.get('role');
  const sbuId = req.nextUrl.searchParams.get('sbuId');
  const month = req.nextUrl.searchParams.get('month');

  if (!role || !sbuId || !month) {
    return NextResponse.json(
      { error: 'role, sbuId, and month are required' },
      { status: 400 }
    );
  }
  const monthDate = monthToDate(month);

  const { rows: submissionRows } = await pool.query(
    `SELECT id, submitted_by_enroll, submitted_at FROM kpi_submissions
     WHERE sbu_id = $1 AND role = $2 AND month = $3`,
    [sbuId, role, monthDate]
  );
  const submission = submissionRows[0] ?? null;

  const { rows: kpis } = await pool.query(
    `SELECT
       k.id, k.sl, k.perspective, k.strategic_goal, k.name, k.weight_pct,
       k.direction, k.industry_benchmark, k.uom, k.kpi_driver,
       k.measurement_criteria, k.data_source, k.frequency, k.evidence_type,
       k.evidence_link_label, k.required_evidence, k.capturing_method,
       e.target_value, e.achievement_value, e.achievement_pct, e.weighted_score,
       e.evidence_link, e.evidence_note
     FROM kpis k
     LEFT JOIN kpi_entries e
       ON e.kpi_id = k.id AND e.sbu_id = $1 AND e.month = $3
     WHERE k.evidence_owner_role = $2
     ORDER BY k.sl`,
    [sbuId, role, monthDate]
  );

  return NextResponse.json({
    locked: !!submission,
    submission,
    kpis,
  });
}
