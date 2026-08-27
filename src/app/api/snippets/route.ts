import { and, eq } from 'drizzle-orm';

import { db } from '@/lib/db/client';
import { ensureDatabaseReady } from '@/lib/bootstrap';
import { folders, snippets, workspaces } from '@/lib/db/schema';
import { getAuthUser, newId } from '@/lib/session';
import { error, json } from '@/lib/http';
import { snippetSchema } from '@/lib/validators';

export async function POST(request: Request) {
  await ensureDatabaseReady();
  const user = await getAuthUser();
  if (!user) {
    return error('Unauthorized', 401);
  }

  const parsed = snippetSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return error('Invalid snippet payload', 400, { issues: parsed.error.flatten() });
  }

  if (parsed.data.workspaceId) {
    const workspace = await db.query.workspaces.findFirst({
      where: and(eq(workspaces.id, parsed.data.workspaceId), eq(workspaces.userId, user.id)),
    });
    if (!workspace) {
      return error('Workspace not found', 404);
    }
  }

  if (parsed.data.folderId) {
    const folder = await db.query.folders.findFirst({
      where: and(eq(folders.id, parsed.data.folderId), eq(folders.userId, user.id)),
    });
    if (!folder) {
      return error('Folder not found', 404);
    }
  }

  const now = new Date().toISOString();
  const snippet = {
    id: newId(),
    userId: user.id,
    workspaceId: parsed.data.workspaceId ?? null,
    folderId: parsed.data.folderId ?? null,
    title: parsed.data.title,
    icon: parsed.data.icon,
    content: parsed.data.content,
    language: parsed.data.language,
    favorite: false,
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
  };

  await db.insert(snippets).values(snippet);
  return json({ snippet }, { status: 201 });
}

