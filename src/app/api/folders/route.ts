import { db } from '@/lib/db/client';
import { ensureDatabaseReady } from '@/lib/bootstrap';
import { folders, workspaces } from '@/lib/db/schema';
import { getAuthUser, newId } from '@/lib/session';
import { error, json } from '@/lib/http';
import { folderSchema } from '@/lib/validators';
import { and, eq } from 'drizzle-orm';

export async function POST(request: Request) {
  await ensureDatabaseReady();
  const user = await getAuthUser();
  if (!user) {
    return error('Unauthorized', 401);
  }

  const parsed = folderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return error('Invalid folder payload', 400, { issues: parsed.error.flatten() });
  }

  const workspace = await db.query.workspaces.findFirst({
    where: and(eq(workspaces.id, parsed.data.workspaceId), eq(workspaces.userId, user.id)),
  });
  if (!workspace) {
    return error('Workspace not found', 404);
  }

  const now = new Date().toISOString();
  const folder = {
    id: newId(),
    userId: user.id,
    workspaceId: parsed.data.workspaceId,
    title: parsed.data.title,
    icon: parsed.data.icon,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(folders).values(folder);
  return json({ folder }, { status: 201 });
}

