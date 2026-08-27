import 'server-only';

import { asc, eq } from 'drizzle-orm';

import { ensureDatabaseReady } from '@/lib/bootstrap';
import { db } from '@/lib/db/client';
import { folders, snippets, users, workspaces } from '@/lib/db/schema';
import { getAuthUser } from '@/lib/session';

export async function requireAdmin() {
  await ensureDatabaseReady();
  const user = await getAuthUser();
  return user?.isAdmin ? user : null;
}

export async function getAdminOverview() {
  await ensureDatabaseReady();

  const [userRows, workspaceRows, folderRows, snippetRows] = await Promise.all([
    db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(asc(users.createdAt)),
    db.select().from(workspaces).orderBy(asc(workspaces.createdAt)),
    db.select({ id: folders.id, userId: folders.userId, workspaceId: folders.workspaceId }).from(folders),
    db.select({ id: snippets.id, userId: snippets.userId, workspaceId: snippets.workspaceId }).from(snippets),
  ]);

  return {
    users: userRows.map((user) => ({
      ...user,
      workspaceCount: workspaceRows.filter((workspace) => workspace.userId === user.id).length,
      folderCount: folderRows.filter((folder) => folder.userId === user.id).length,
      snippetCount: snippetRows.filter((snippet) => snippet.userId === user.id).length,
    })),
    workspaces: workspaceRows.map((workspace) => ({
      ...workspace,
      ownerEmail: userRows.find((user) => user.id === workspace.userId)?.email ?? 'Unknown user',
      folderCount: folderRows.filter((folder) => folder.workspaceId === workspace.id).length,
      snippetCount: snippetRows.filter((snippet) => snippet.workspaceId === workspace.id).length,
    })),
    totals: {
      users: userRows.length,
      workspaces: workspaceRows.length,
      folders: folderRows.length,
      snippets: snippetRows.length,
    },
  };
}

export type AdminOverview = Awaited<ReturnType<typeof getAdminOverview>>;

export async function deleteManagedWorkspace(workspaceId: string) {
  const workspace = await db.query.workspaces.findFirst({ where: eq(workspaces.id, workspaceId) });
  if (!workspace) return false;
  await db.delete(workspaces).where(eq(workspaces.id, workspaceId));
  return true;
}

export async function deleteManagedUser(userId: string) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user || user.isAdmin) return false;
  await db.delete(users).where(eq(users.id, userId));
  return true;
}
