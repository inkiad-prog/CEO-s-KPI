import { redirect } from 'next/navigation';
import { requireDashboardAdmin } from '@/lib/auth';
import { OverallReportClient } from './OverallReportClient';

export default async function DashboardOverallReport() {
  const enrollNumber = await requireDashboardAdmin();
  if (!enrollNumber) {
    redirect('/dashboard');
  }

  return <OverallReportClient enrollNumber={enrollNumber} />;
}
