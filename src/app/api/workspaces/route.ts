import { db } from '@/lib/db/client';
import { ensureDatabaseReady } from '@/lib/bootstrap';
import { workspaces } from '@/lib/db/schema';
import { getAuthUser, newId } from '@/lib/session';
import { error, json } from '@/lib/http';
import { workspaceSchema } from '@/lib/validators';

export async function POST(request: Request) {
  await ensureDatabaseReady();
  const user = await getAuthUser();
  if (!user) {
    return error('Unauthorized', 401);
  }

  const parsed = workspaceSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return error('Invalid workspace payload', 400, { issues: parsed.error.flatten() });
  }

  const now = new Date().toISOString();
  const workspace = {
    id: newId(),
    userId: user.id,
    title: parsed.data.title,
    icon: parsed.data.icon,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(workspaces).values(workspace);
  return json({ workspace }, { status: 201 });
}
