import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { requireDashboardAdmin } from '@/lib/auth';
import { achievementPct, monthToDate, weightedScore, type Direction } from '@/lib/kpi';

const TOTAL_ROLES = 4;

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
  const groupParam = req.nextUrl.searchParams.get('group');
  const groupFilter = groupParam === 'trading' || groupParam === 'logistics' ? groupParam : null;

  const { rows: finalizedRows } = await pool.query(
    'SELECT finalized_by_enroll, finalized_at FROM month_finalizations WHERE month = $1',
    [monthDate]
  );
  const finalized = finalizedRows[0] ?? null;

  if (!finalized) {
    // Finalization gates the whole month regardless of which group tab will
    // eventually be viewed, so the pre-finalization status always covers all
    // 15 SBUs.
    const { rows: statusRows } = await pool.query(
      `SELECT s.id, s.name,
         (SELECT COUNT(DISTINCT role) FROM kpi_submissions ks
          WHERE ks.sbu_id = s.id AND ks.month = $1)::int AS roles_submitted
       FROM sbus s ORDER BY s.sort_order`,
      [monthDate]
    );
    const sbuStatus = statusRows.map((r) => ({
      sbuId: r.id,
      sbuName: r.name,
      rolesSubmitted: r.roles_submitted,
      totalRoles: TOTAL_ROLES,
      isComplete: r.roles_submitted >= TOTAL_ROLES,
    }));
    return NextResponse.json({
      finalized: false,
      sbuStatus,
      completion: {
        sbusComplete: sbuStatus.filter((s) => s.isComplete).length,
        totalSbus: sbuStatus.length,
      },
    });
  }

  const { rows: sbus } = await pool.query(
    `SELECT id, name FROM sbus WHERE $1::text IS NULL OR cluster_group = $1 ORDER BY sort_order`,
    [groupFilter]
  );

  const { rows: kpis } = await pool.query(
    `SELECT id, sl, perspective, strategic_goal, name, weight_pct, direction,
       industry_benchmark, uom, target_validation, kpi_driver, measurement_criteria,
       data_source, frequency, evidence_type, evidence_link_label, evidence_owner_role,
       evidence_owner_role AS evidence_owner, required_evidence, capturing_method
     FROM kpis ORDER BY sl`
  );

  const { rows: entries } = await pool.query(
    `SELECT kpi_id, sbu_id, target_value, achievement_value, achievement_pct, weighted_score
     FROM kpi_entries WHERE month = $1`,
    [monthDate]
  );
  const entryMap = new Map<string, (typeof entries)[number]>();
  for (const e of entries) entryMap.set(`${e.kpi_id}_${e.sbu_id}`, e);

  const { rows: goals } = await pool.query(
    `SELECT kpi_id, target_value FROM kpi_cluster_goals WHERE month = $1`,
    [monthDate]
  );
  const goalMap = new Map<number, number>();
  for (const g of goals) goalMap.set(g.kpi_id, Number(g.target_value));

  const rows = kpis.map((k) => {
    const perSbu = sbus.map((s) => {
      const e = entryMap.get(`${k.id}_${s.id}`);
      return {
        sbuId: s.id,
        sbuName: s.name,
        target: e ? Number(e.target_value) : null,
        achievement: e ? Number(e.achievement_value) : null,
        achievementPct: e && e.achievement_pct !== null ? Number(e.achievement_pct) : null,
        weightedScore: e && e.weighted_score !== null ? Number(e.weighted_score) : null,
      };
    });
    const sumTarget = perSbu.reduce((sum, r) => sum + (r.target ?? 0), 0);
    const sumAchievement = perSbu.reduce((sum, r) => sum + (r.achievement ?? 0), 0);
    const hasEntries = perSbu.some((r) => r.target !== null);
    const pct = hasEntries
      ? achievementPct(sumAchievement, sumTarget, k.direction as Direction)
      : null;

    return {
      kpiId: k.id,
      sl: k.sl,
      perspective: k.perspective,
      strategic_goal: k.strategic_goal,
      name: k.name,
      weight_pct: k.weight_pct,
      direction: k.direction,
      industry_benchmark: k.industry_benchmark,
      uom: k.uom,
      // Revenue's cluster goal is a % budget-achievement benchmark even though
      // its per-SBU target/achievement figures are in BDT, per guideline.
      goalUom: k.sl === 1 ? '%' : k.uom,
      target_validation: k.target_validation,
      kpi_driver: k.kpi_driver,
      measurement_criteria: k.measurement_criteria,
      data_source: k.data_source,
      frequency: k.frequency,
      evidence_type: k.evidence_type,
      evidence_link_label: k.evidence_link_label,
      evidence_owner_role: k.evidence_owner_role,
      required_evidence: k.required_evidence,
      capturing_method: k.capturing_method,
      perSbu,
      clusterGoal: goalMap.get(k.id) ?? null,
      sumTarget,
      sumAchievement,
      achievementPct: pct,
      weightedScore: pct !== null ? weightedScore(pct, Number(k.weight_pct)) : 0,
    };
  });

  return NextResponse.json({ finalized, sbus, rows, group: groupFilter ?? 'all' });
}
