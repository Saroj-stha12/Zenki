import { and, eq } from 'drizzle-orm';

import { db } from '@/lib/db/client';
import { ensureDatabaseReady } from '@/lib/bootstrap';
import { folders } from '@/lib/db/schema';
import { getAuthUser } from '@/lib/session';
import { error, json } from '@/lib/http';
import { folderSchema } from '@/lib/validators';

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
  const parsed = folderSchema.partial().safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return error('Invalid folder payload', 400, { issues: parsed.error.flatten() });
  }

  const current = await db.query.folders.findFirst({
    where: and(eq(folders.id, id), eq(folders.userId, user.id)),
  });
  if (!current) {
    return error('Folder not found', 404);
  }

  const updated = {
    title: parsed.data.title ?? current.title,
    icon: parsed.data.icon ?? current.icon,
    updatedAt: new Date().toISOString(),
  };

  await db.update(folders).set(updated).where(eq(folders.id, id));
  return json({ folder: { ...current, ...updated } });
}

export async function DELETE(_: Request, { params }: Params) {
  await ensureDatabaseReady();
  const user = await getAuthUser();
  if (!user) {
    return error('Unauthorized', 401);
  }

  const { id } = await params;
  const current = await db.query.folders.findFirst({
    where: and(eq(folders.id, id), eq(folders.userId, user.id)),
  });
  if (!current) {
    return error('Folder not found', 404);
  }

  await db.delete(folders).where(eq(folders.id, id));
  return json({ ok: true });
}
