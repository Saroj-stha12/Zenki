import { getAdminOverview, requireAdmin } from '@/lib/admin';
import { error, json } from '@/lib/http';

export async function GET() {
  if (!(await requireAdmin())) {
    return error('Forbidden', 403);
  }

  return json(await getAdminOverview());
}
