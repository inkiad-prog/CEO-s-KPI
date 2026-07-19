import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { requireDashboardAdmin } from '@/lib/auth';
import { PERSPECTIVES, monthToDate } from '@/lib/kpi';

export async function GET(req: NextRequest) {
  const admin = await requireDashboardAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  const month = req.nextUrl.searchParams.get('month');
  if (!month) {
    return NextResponse.json({ error: 'month is required' }, { status: 400 });
  }
  const monthDate = monthToDate(month);

  const { rows: finalizedRows } = await pool.query(
    'SELECT finalized_by_enroll, finalized_at FROM month_finalizations_simple WHERE month = $1',
    [monthDate]
  );
  const finalized = finalizedRows[0] ?? null;

  const { rows: submissions } = await pool.query(
    `SELECT perspective, submitted_by_enroll, submitted_at FROM kpi_submissions_simple WHERE month = $1`,
    [monthDate]
  );
  const submissionMap = new Map(submissions.map((s) => [s.perspective, s]));
  const perspectiveStatus = PERSPECTIVES.map((perspective) => {
    const s = submissionMap.get(perspective);
    return {
      perspective,
      submitted: !!s,
      submittedByEnroll: s?.submitted_by_enroll ?? null,
      submittedAt: s?.submitted_at ?? null,
    };
  });

  if (!finalized) {
    return NextResponse.json({
      finalized: false,
      perspectiveStatus,
      completion: {
        perspectivesComplete: perspectiveStatus.filter((p) => p.submitted).length,
        totalPerspectives: PERSPECTIVES.length,
      },
    });
  }

  const { rows } = await pool.query(
    `SELECT
       k.id AS kpi_id, k.sl, k.perspective, k.strategic_goal, k.name, k.weight_pct,
       k.direction, k.industry_benchmark, k.uom, k.target_validation, k.kpi_driver,
       k.measurement_criteria, k.frequency, k.required_evidence,
       e.target_value, e.achievement_value, e.achievement_pct, e.weighted_score,
       e.evidence_link, e.evidence_type, e.data_source, e.evidence_owner,
       e.entered_by_enroll, e.updated_at
     FROM kpis k
     JOIN kpi_simple_set s ON s.kpi_id = k.id
     LEFT JOIN kpi_entries_simple e ON e.kpi_id = k.id AND e.month = $1
     ORDER BY k.sl`,
    [monthDate]
  );

  return NextResponse.json({ finalized, perspectiveStatus, rows });
}
