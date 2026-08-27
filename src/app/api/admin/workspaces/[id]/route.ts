import { deleteManagedWorkspace, requireAdmin } from '@/lib/admin';
import { error, json } from '@/lib/http';

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_: Request, { params }: Params) {
  if (!(await requireAdmin())) {
    return error('Forbidden', 403);
  }

  const { id } = await params;
  if (!(await deleteManagedWorkspace(id))) {
    return error('Workspace not found', 404);
  }

  return json({ ok: true });
}
