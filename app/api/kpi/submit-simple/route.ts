import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { ENROLL_HINT, PERSPECTIVES, achievementPct, isValidEnroll, monthToDate, weightedScore, type Direction } from '@/lib/kpi';

export async function POST(req: NextRequest) {
  const { perspective, month, enrollNumber, entries } = await req.json();

  if (
    !perspective ||
    !PERSPECTIVES.includes(perspective) ||
    !month ||
    !enrollNumber ||
    !Array.isArray(entries)
  ) {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
  }
  if (!isValidEnroll(enrollNumber)) {
    return NextResponse.json({ error: ENROLL_HINT }, { status: 400 });
  }
  const monthDate = monthToDate(month);

  const { rows: existingSubmission } = await pool.query(
    `SELECT id FROM kpi_submissions_simple WHERE perspective = $1 AND month = $2`,
    [perspective, monthDate]
  );
  if (existingSubmission.length > 0) {
    return NextResponse.json(
      { error: 'This perspective has already been submitted for this month. Entries are locked.' },
      { status: 409 }
    );
  }

  const { rows: kpis } = await pool.query(
    `SELECT id, weight_pct, direction FROM kpis WHERE perspective = $1`,
    [perspective]
  );

  if (kpis.length === 0) {
    return NextResponse.json({ error: 'No KPIs found for this perspective.' }, { status: 400 });
  }

  const entryMap = new Map<
    number,
    {
      targetValue: number;
      achievementValue: number;
      evidenceLink: string;
      evidenceType: string;
      dataSource: string;
      evidenceOwner: string;
    }
  >();
  for (const e of entries) {
    const target = Number(e.targetValue);
    const actual = Number(e.achievementValue);
    if (!Number.isFinite(target) || !Number.isFinite(actual)) {
      return NextResponse.json(
        { error: 'All target and achievement values must be valid numbers.' },
        { status: 400 }
      );
    }
    const evidenceLink = String(e.evidenceLink ?? '').trim();
    const evidenceType = String(e.evidenceType ?? '').trim();
    const dataSource = String(e.dataSource ?? '').trim();
    const evidenceOwner = String(e.evidenceOwner ?? '').trim();
    if (!evidenceLink || !evidenceType || !dataSource || !evidenceOwner) {
      return NextResponse.json(
        { error: 'Every KPI needs evidence, evidence type, data source, and an evidence owner before submitting.' },
        { status: 400 }
      );
    }
    entryMap.set(e.kpiId, {
      targetValue: target,
      achievementValue: actual,
      evidenceLink,
      evidenceType,
      dataSource,
      evidenceOwner,
    });
  }

  const computed: {
    kpiId: number;
    targetValue: number;
    achievementValue: number;
    achievementPct: number;
    weightedScore: number;
    evidenceLink: string;
    evidenceType: string;
    dataSource: string;
    evidenceOwner: string;
  }[] = [];

  for (const k of kpis) {
    const entry = entryMap.get(k.id);
    if (!entry) {
      return NextResponse.json(
        { error: 'All KPIs for this perspective must have a target and achievement before submitting.' },
        { status: 400 }
      );
    }
    const pct = achievementPct(
      entry.achievementValue,
      entry.targetValue,
      k.direction as Direction
    );
    if (pct === null) {
      return NextResponse.json(
        { error: 'One or more values are invalid for their KPI direction (target must be > 0; for lower-is-better metrics, actual must be > 0 too).' },
        { status: 400 }
      );
    }
    computed.push({
      kpiId: k.id,
      targetValue: entry.targetValue,
      achievementValue: entry.achievementValue,
      achievementPct: pct,
      weightedScore: weightedScore(pct, Number(k.weight_pct)),
      evidenceLink: entry.evidenceLink,
      evidenceType: entry.evidenceType,
      dataSource: entry.dataSource,
      evidenceOwner: entry.evidenceOwner,
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: submissionRows } = await client.query(
      `INSERT INTO kpi_submissions_simple (perspective, month, submitted_by_enroll)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [perspective, monthDate, enrollNumber]
    );
    const submissionId = submissionRows[0].id;

    for (const c of computed) {
      await client.query(
        `INSERT INTO kpi_entries_simple
           (kpi_id, month, submission_id, target_value, achievement_value, achievement_pct, weighted_score, evidence_link, evidence_type, data_source, evidence_owner, entered_by_enroll)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (kpi_id, month)
         DO UPDATE SET submission_id = excluded.submission_id,
           target_value = excluded.target_value,
           achievement_value = excluded.achievement_value,
           achievement_pct = excluded.achievement_pct,
           weighted_score = excluded.weighted_score,
           evidence_link = excluded.evidence_link,
           evidence_type = excluded.evidence_type,
           data_source = excluded.data_source,
           evidence_owner = excluded.evidence_owner,
           entered_by_enroll = excluded.entered_by_enroll,
           updated_at = now()`,
        [
          c.kpiId,
          monthDate,
          submissionId,
          c.targetValue,
          c.achievementValue,
          c.achievementPct,
          c.weightedScore,
          c.evidenceLink,
          c.evidenceType,
          c.dataSource,
          c.evidenceOwner,
          enrollNumber,
        ]
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return NextResponse.json({ ok: true });
}
