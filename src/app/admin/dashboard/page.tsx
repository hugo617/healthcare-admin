import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Dashboard() {
  const session = await auth();

  if (!session?.user) {
    return redirect('/admin/login');
  } else {
    redirect('/admin/dashboard/overview');
  }
}
