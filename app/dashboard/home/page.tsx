import { redirect } from 'next/navigation';
import { requireDashboardAdmin } from '@/lib/auth';
import { DashboardHomeClient } from './DashboardHomeClient';

export default async function DashboardHome() {
  const enrollNumber = await requireDashboardAdmin();
  if (!enrollNumber) {
    redirect('/dashboard');
  }

  return <DashboardHomeClient enrollNumber={enrollNumber} />;
}
