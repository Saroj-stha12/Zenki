import { redirect } from 'next/navigation';

import AdminDashboard from '@/components/admin-dashboard';
import { getAdminOverview, requireAdmin } from '@/lib/admin';

export default async function AdminPage() {
  const admin = await requireAdmin();
  if (!admin) {
    redirect('/');
  }

  return (
    <AdminDashboard
      admin={{ id: admin.id, email: admin.email, displayName: admin.displayName }}
      initialData={await getAdminOverview()}
    />
  );
}
