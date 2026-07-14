import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { ENROLL_HINT, isValidEnroll } from '@/lib/kpi';

export async function POST(req: NextRequest) {
  const { enrollNumber } = await req.json();

  if (typeof enrollNumber !== 'string' || !enrollNumber.trim()) {
    return NextResponse.json(
      { ok: false, error: 'Enroll number is required.' },
      { status: 400 }
    );
  }

  if (!isValidEnroll(enrollNumber.trim())) {
    return NextResponse.json({ ok: false, error: ENROLL_HINT }, { status: 400 });
  }

  const result = await pool.query(
    'SELECT enroll_number FROM dashboard_admins WHERE enroll_number = $1',
    [enrollNumber.trim()]
  );

  if (result.rowCount === 0) {
    return NextResponse.json(
      { ok: false, error: 'This enroll number does not have dashboard access.' },
      { status: 403 }
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set('ceo_kpi_dashboard_enroll', enrollNumber.trim(), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  });
  return response;
}
