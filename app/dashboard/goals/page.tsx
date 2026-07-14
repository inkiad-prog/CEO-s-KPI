import { redirect } from 'next/navigation';
import { requireDashboardAdmin } from '@/lib/auth';
import { GoalsClient } from './GoalsClient';

export default async function DashboardGoals() {
  const enrollNumber = await requireDashboardAdmin();
  if (!enrollNumber) {
    redirect('/dashboard');
  }

  return <GoalsClient enrollNumber={enrollNumber} />;
}
