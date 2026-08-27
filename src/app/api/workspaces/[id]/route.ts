import { and, eq } from 'drizzle-orm';

import { db } from '@/lib/db/client';
import { ensureDatabaseReady } from '@/lib/bootstrap';
import { folders, snippets, workspaces } from '@/lib/db/schema';
import { getAuthUser } from '@/lib/session';
import { error, json } from '@/lib/http';
import { workspaceSchema } from '@/lib/validators';

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: Params) {
  await ensureDatabaseReady();
  const user = await getAuthUser();
  if (!user) {
    return error('Unauthorized', 401);
  }

  const { id } = await params;
  const parsed = workspaceSchema.partial().safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return error('Invalid workspace payload', 400, { issues: parsed.error.flatten() });
  }

  const current = await db.query.workspaces.findFirst({
    where: and(eq(workspaces.id, id), eq(workspaces.userId, user.id)),
  });
  if (!current) {
    return error('Workspace not found', 404);
  }

  const updated = {
    title: parsed.data.title ?? current.title,
    icon: parsed.data.icon ?? current.icon,
    updatedAt: new Date().toISOString(),
  };

  await db.update(workspaces).set(updated).where(eq(workspaces.id, id));
  return json({ workspace: { ...current, ...updated } });
}

export async function DELETE(_: Request, { params }: Params) {
  await ensureDatabaseReady();
  const user = await getAuthUser();
  if (!user) {
    return error('Unauthorized', 401);
  }

  const { id } = await params;
  const current = await db.query.workspaces.findFirst({
    where: and(eq(workspaces.id, id), eq(workspaces.userId, user.id)),
  });
  if (!current) {
    return error('Workspace not found', 404);
  }

  await db.delete(folders).where(eq(folders.workspaceId, id));
  await db.delete(snippets).where(eq(snippets.workspaceId, id));
  await db.delete(workspaces).where(eq(workspaces.id, id));
  return json({ ok: true });
}
