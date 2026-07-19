import { redirect } from 'next/navigation';
import { requireDashboardAdmin } from '@/lib/auth';
import { ReportClient } from './ReportClient';

export default async function DashboardReport({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const enrollNumber = await requireDashboardAdmin();
  if (!enrollNumber) {
    redirect('/dashboard');
  }

  const { month } = await searchParams;

  return <ReportClient enrollNumber={enrollNumber} initialMonth={month ?? ''} />;
}
