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

  const { rows: kpis } = await pool.query(
    `SELECT
       k.id, k.sl, k.perspective, k.name, k.weight_pct, k.direction, k.uom,
       e.target_value, e.achievement_value, e.achievement_pct, e.weighted_score,
       e.entered_by_enroll, e.updated_at
     FROM kpis k
     JOIN kpi_simple_set s ON s.kpi_id = k.id
     LEFT JOIN kpi_entries_simple e ON e.kpi_id = k.id AND e.month = $1
     ORDER BY k.sl`,
    [monthDate]
  );

  const kpiTable = kpis.map((k) => {
    const hasEntry = k.target_value !== null;
    const pct = k.achievement_pct !== null ? Number(k.achievement_pct) : null;
    return {
      kpiId: k.id,
      sl: k.sl,
      perspective: k.perspective,
      name: k.name,
      weightPct: Number(k.weight_pct),
      uom: k.uom,
      target: hasEntry ? Number(k.target_value) : null,
      achievement: hasEntry ? Number(k.achievement_value) : null,
      achievementPct: pct,
      weightedScore: k.weighted_score !== null ? Number(k.weighted_score) : 0,
      enteredByEnroll: k.entered_by_enroll,
      enteredAt: k.updated_at,
    };
  });

  const kpiTotals = {
    weightedScoreSum: kpiTable.reduce((sum, k) => sum + k.weightedScore, 0),
    entriesComplete: kpiTable.filter((k) => k.target !== null).length,
    totalKpis: kpiTable.length,
  };

  const perspectiveTotalWeight = new Map<string, number>();
  const perspectiveScoreSum = new Map<string, number>();
  for (const k of kpiTable) {
    perspectiveTotalWeight.set(k.perspective, (perspectiveTotalWeight.get(k.perspective) ?? 0) + k.weightPct);
    perspectiveScoreSum.set(k.perspective, (perspectiveScoreSum.get(k.perspective) ?? 0) + k.weightedScore);
  }
  const perspectives = PERSPECTIVES.map((perspective) => {
    const totalWeight = perspectiveTotalWeight.get(perspective) ?? 0;
    return {
      perspective,
      achievementPct: totalWeight > 0 ? ((perspectiveScoreSum.get(perspective) ?? 0) / totalWeight) * 100 : 0,
    };
  });

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
  const perspectivesComplete = perspectiveStatus.filter((p) => p.submitted).length;

  const { rows: finalizedRows } = await pool.query(
    'SELECT finalized_by_enroll, finalized_at FROM month_finalizations_simple WHERE month = $1',
    [monthDate]
  );

  return NextResponse.json({
    month,
    kpiTable,
    kpiTotals,
    perspectives,
    perspectiveStatus,
    completion: {
      perspectivesComplete,
      totalPerspectives: PERSPECTIVES.length,
      allComplete: perspectivesComplete === PERSPECTIVES.length,
    },
    finalized: finalizedRows[0] ?? null,
  });
}
