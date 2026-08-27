import { deleteManagedUser, requireAdmin } from '@/lib/admin';
import { error, json } from '@/lib/http';

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_: Request, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin) {
    return error('Forbidden', 403);
  }

  const { id } = await params;
  if (id === admin.id) {
    return error('The active admin account cannot be deleted', 400);
  }
  if (!(await deleteManagedUser(id))) {
    return error('User not found or is protected', 404);
  }

  return json({ ok: true });
}
