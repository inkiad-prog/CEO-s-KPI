import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { ROLES, achievementPct, monthToDate, weightedScore, type Direction } from '@/lib/kpi';

const TOTAL_ROLES = 4;
const GROUP_SCOPES = new Set(['all', 'trading', 'logistics']);

export async function GET(req: NextRequest) {
  const month = req.nextUrl.searchParams.get('month');
  const scope = req.nextUrl.searchParams.get('scope') ?? 'all';
  if (!month) {
    return NextResponse.json({ error: 'month is required' }, { status: 400 });
  }
  const monthDate = monthToDate(month);
  const isGroupScope = GROUP_SCOPES.has(scope);
  const groupFilter = scope === 'trading' || scope === 'logistics' ? scope : null;

  const { rows: kpiCountRows } = await pool.query('SELECT count(*)::int AS n FROM kpis');
  const TOTAL_KPIS = kpiCountRows[0].n;

  // Per-SBU summary (comparison bars + completion). Always all 15 SBUs, so
  // the SBU picker dropdown stays complete; the frontend filters this by
  // clusterGroup for the comparison bars when a group tab is active.
  const { rows } = await pool.query(
    `SELECT
       s.id AS sbu_id,
       s.name AS sbu_name,
       s.cluster_group,
       COALESCE(SUM(ke.weighted_score), 0)::float AS achievement,
       COUNT(ke.id)::int AS kpi_count,
       (SELECT COUNT(DISTINCT role) FROM kpi_submissions ks
        WHERE ks.sbu_id = s.id AND ks.month = $1)::int AS roles_submitted
     FROM sbus s
     LEFT JOIN kpi_entries ke ON ke.sbu_id = s.id AND ke.month = $1
     GROUP BY s.id, s.name, s.cluster_group
     ORDER BY s.sort_order`,
    [monthDate]
  );

  const sbus = rows.map((r) => ({
    sbuId: r.sbu_id,
    sbuName: r.sbu_name,
    clusterGroup: r.cluster_group as 'trading' | 'logistics',
    achievement: r.achievement,
    kpiCount: r.kpi_count,
    totalKpis: TOTAL_KPIS,
    rolesSubmitted: r.roles_submitted,
    totalRoles: TOTAL_ROLES,
    isComplete: r.roles_submitted >= TOTAL_ROLES,
  }));

  // Completion is scoped to whichever SBUs are in view (all 15, or just the
  // active group), so "X/Y complete" always matches what's on screen.
  const scopedSbus = groupFilter ? sbus.filter((s) => s.clusterGroup === groupFilter) : sbus;
  const sbusComplete = scopedSbus.filter((s) => s.isComplete).length;

  const { rows: finalizedRows } = await pool.query(
    'SELECT finalized_by_enroll, finalized_at FROM month_finalizations WHERE month = $1',
    [monthDate]
  );

  // KPI-level table: differs by scope
  let kpiTable;
  if (isGroupScope) {
    const { rows: kpis } = await pool.query(
      `SELECT k.id, k.sl, k.perspective, k.name, k.weight_pct, k.direction, k.uom,
         g.target_value AS cluster_goal,
         COALESCE(SUM(e.target_value), 0)::float AS sum_target,
         COALESCE(SUM(e.achievement_value), 0)::float AS sum_achievement,
         COUNT(e.id)::int AS entry_count
       FROM kpis k
       LEFT JOIN kpi_cluster_goals g ON g.kpi_id = k.id AND g.month = $1
       LEFT JOIN kpi_entries e ON e.kpi_id = k.id AND e.month = $1
         AND e.sbu_id IN (SELECT id FROM sbus WHERE $2::text IS NULL OR cluster_group = $2)
       GROUP BY k.id, k.sl, k.perspective, k.name, k.weight_pct, k.direction, k.uom, g.target_value
       ORDER BY k.sl`,
      [monthDate, groupFilter]
    );
    kpiTable = kpis.map((k) => {
      const pct =
        k.entry_count > 0
          ? achievementPct(k.sum_achievement, k.sum_target, k.direction as Direction)
          : null;
      return {
        kpiId: k.id,
        sl: k.sl,
        perspective: k.perspective,
        name: k.name,
        weightPct: Number(k.weight_pct),
        uom: k.uom,
        // Revenue's per-SBU target/achievement are real BDT figures, but its
        // cluster-wide goal is a % budget-achievement benchmark, per guideline.
        goalUom: k.sl === 1 ? '%' : k.uom,
        clusterGoal: k.cluster_goal !== null ? Number(k.cluster_goal) : null,
        target: k.sum_target,
        achievement: k.sum_achievement,
        achievementPct: pct,
        weightedScore: pct !== null ? weightedScore(pct, Number(k.weight_pct)) : 0,
        entryCount: k.entry_count,
      };
    });
  } else {
    const { rows: kpis } = await pool.query(
      `SELECT k.id, k.sl, k.perspective, k.name, k.weight_pct, k.direction, k.uom,
         e.target_value, e.achievement_value, e.achievement_pct, e.weighted_score
       FROM kpis k
       LEFT JOIN kpi_entries e ON e.kpi_id = k.id AND e.sbu_id = $2 AND e.month = $1
       ORDER BY k.sl`,
      [monthDate, scope]
    );
    kpiTable = kpis.map((k) => ({
      kpiId: k.id,
      sl: k.sl,
      perspective: k.perspective,
      name: k.name,
      weightPct: Number(k.weight_pct),
      uom: k.uom,
      clusterGoal: null,
      target: k.target_value !== null ? Number(k.target_value) : null,
      achievement: k.achievement_value !== null ? Number(k.achievement_value) : null,
      achievementPct: k.achievement_pct !== null ? Number(k.achievement_pct) : null,
      weightedScore: k.weighted_score !== null ? Number(k.weighted_score) : 0,
      entryCount: k.target_value !== null ? 1 : 0,
    }));
  }

  const kpiTotals = {
    weightedScoreSum: kpiTable.reduce((sum, k) => sum + k.weightedScore, 0),
    entriesComplete: kpiTable.filter((k) => k.entryCount > 0).length,
    totalKpis: kpiTable.length,
  };

  // Perspective breakdown derived from the same scoped KPI table, so the
  // overview gauges always match the table below regardless of scope.
  const perspectiveTotalWeight = new Map<string, number>();
  const perspectiveScoreSum = new Map<string, number>();
  for (const k of kpiTable) {
    perspectiveTotalWeight.set(
      k.perspective,
      (perspectiveTotalWeight.get(k.perspective) ?? 0) + k.weightPct
    );
    perspectiveScoreSum.set(
      k.perspective,
      (perspectiveScoreSum.get(k.perspective) ?? 0) + k.weightedScore
    );
  }
  const perspectives = Array.from(perspectiveTotalWeight.entries()).map(
    ([perspective, totalWeight]) => ({
      perspective,
      achievementPct:
        totalWeight > 0
          ? ((perspectiveScoreSum.get(perspective) ?? 0) / totalWeight) * 100
          : 0,
    })
  );

  // Per-role submission status, only meaningful when scoped to a single SBU.
  let roleStatus: { role: string; submitted: boolean }[] | null = null;
  if (!isGroupScope) {
    const { rows: submitted } = await pool.query(
      `SELECT DISTINCT role FROM kpi_submissions WHERE sbu_id = $1 AND month = $2`,
      [scope, monthDate]
    );
    const submittedRoles = new Set(submitted.map((r) => r.role));
    roleStatus = ROLES.map((role) => ({ role, submitted: submittedRoles.has(role) }));
  }

  return NextResponse.json({
    scope,
    kpiTable,
    kpiTotals,
    sbus,
    perspectives,
    roleStatus,
    completion: {
      sbusComplete,
      totalSbus: scopedSbus.length,
      allComplete: sbusComplete === scopedSbus.length && scopedSbus.length > 0,
    },
    finalized: finalizedRows[0] ?? null,
  });
}
