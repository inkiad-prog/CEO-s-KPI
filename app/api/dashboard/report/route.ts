import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { requireDashboardAdmin } from '@/lib/auth';
import { SBU_GROUP_LABEL, achievementPct, monthToDate, weightedScore, type Direction } from '@/lib/kpi';

const GROUP_SCOPES = new Set(['all', 'trading', 'logistics']);

export async function GET(req: NextRequest) {
  const admin = await requireDashboardAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  const sbuId = req.nextUrl.searchParams.get('sbuId') ?? 'all';
  const month = req.nextUrl.searchParams.get('month');
  if (!month) {
    return NextResponse.json({ error: 'month is required' }, { status: 400 });
  }
  const monthDate = monthToDate(month);

  if (GROUP_SCOPES.has(sbuId)) {
    const groupFilter = sbuId === 'trading' || sbuId === 'logistics' ? sbuId : null;

    const { rows: sbuCountRows } = await pool.query(
      `SELECT count(*)::int AS n FROM sbus WHERE $1::text IS NULL OR cluster_group = $1`,
      [groupFilter]
    );
    const totalSbus = sbuCountRows[0].n;

    const { rows } = await pool.query(
      `SELECT
         k.id, k.sl, k.perspective, k.strategic_goal, k.name, k.weight_pct, k.direction,
         k.industry_benchmark, k.uom, k.target_validation, k.kpi_driver,
         k.measurement_criteria, k.data_source, k.frequency, k.evidence_type,
         k.evidence_link_label, k.evidence_owner_role, k.capturing_method,
         g.target_value AS cluster_goal,
         COALESCE(SUM(e.target_value), 0)::float AS sum_target,
         COALESCE(SUM(e.achievement_value), 0)::float AS sum_achievement,
         COUNT(e.id)::int AS entry_count
       FROM kpis k
       LEFT JOIN kpi_cluster_goals g ON g.kpi_id = k.id AND g.month = $1
       LEFT JOIN kpi_entries e ON e.kpi_id = k.id AND e.month = $1
         AND e.sbu_id IN (SELECT id FROM sbus WHERE $2::text IS NULL OR cluster_group = $2)
       GROUP BY k.id, k.sl, k.perspective, k.strategic_goal, k.name, k.weight_pct,
         k.direction, k.industry_benchmark, k.uom, k.target_validation, k.kpi_driver,
         k.measurement_criteria, k.data_source, k.frequency, k.evidence_type,
         k.evidence_link_label, k.evidence_owner_role, k.capturing_method, g.target_value
       ORDER BY k.sl`,
      [monthDate, groupFilter]
    );

    const reportRows = rows.map((k) => {
      const pct =
        k.entry_count > 0
          ? achievementPct(k.sum_achievement, k.sum_target, k.direction as Direction)
          : null;
      return {
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
        capturing_method: k.capturing_method,
        clusterGoal: k.cluster_goal !== null ? Number(k.cluster_goal) : null,
        sumTarget: k.sum_target,
        sumAchievement: k.sum_achievement,
        achievement_pct: pct,
        weighted_score: pct !== null ? weightedScore(pct, Number(k.weight_pct)) : 0,
        entryCount: k.entry_count,
        totalSbus,
      };
    });

    const sbuName = groupFilter ? SBU_GROUP_LABEL[groupFilter] : 'All SBUs (cluster)';
    return NextResponse.json({ sbuName, scope: sbuId, rows: reportRows });
  }

  const { rows: sbuRows } = await pool.query('SELECT name FROM sbus WHERE id = $1', [sbuId]);
  const sbuName = sbuRows[0]?.name ?? null;
  if (!sbuName) {
    return NextResponse.json({ error: 'Unknown SBU.' }, { status: 404 });
  }

  const { rows } = await pool.query(
    `SELECT
       k.sl, k.perspective, k.strategic_goal, k.name, k.weight_pct, k.direction,
       k.industry_benchmark, k.uom, k.target_validation, k.kpi_driver,
       k.measurement_criteria, k.data_source, k.frequency, k.evidence_type,
       k.evidence_link_label, k.evidence_owner_role, k.capturing_method,
       e.target_value, e.achievement_value, e.achievement_pct, e.weighted_score,
       e.evidence_link, e.evidence_note, e.entered_by_enroll, e.updated_at
     FROM kpis k
     LEFT JOIN kpi_entries e ON e.kpi_id = k.id AND e.sbu_id = $1 AND e.month = $2
     ORDER BY k.sl`,
    [sbuId, monthDate]
  );

  return NextResponse.json({ sbuName, scope: sbuId, rows });
}
