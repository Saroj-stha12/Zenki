import 'server-only';

import bcrypt from 'bcryptjs';
import { and, asc, desc, eq, inArray, like, or } from 'drizzle-orm';
import { db, client as sqliteClient } from '@/lib/db/client';
import {
  folders,
  snippetTags,
  snippets,
  tags,
  users,
  workspaces,
  type Folder,
  type Snippet,
  type Tag,
  type Workspace,
} from '@/lib/db/schema';
import { env } from '@/lib/env';
import { getAuthUser, newId } from '@/lib/session';

let migrationPromise: Promise<void> | null = null;

export async function ensureDatabaseReady() {
  if (!migrationPromise) {
    migrationPromise = (async () => {
      await sqliteClient.execute('PRAGMA foreign_keys = ON');
      const { migrate } = await import('drizzle-orm/libsql/migrator');
      await migrate(db, { migrationsFolder: 'drizzle' });

      const email = env.ADMIN_EMAIL.toLowerCase();
      const existingAdmin = await db.query.users.findFirst({ where: eq(users.email, email) });
      const now = new Date().toISOString();
      const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);

      if (existingAdmin) {
        await db
          .update(users)
          .set({ isAdmin: true, passwordHash, updatedAt: now })
          .where(eq(users.id, existingAdmin.id));
      } else {
        await db.insert(users).values({
          id: crypto.randomUUID(),
          email,
          passwordHash,
          displayName: 'Zenki Admin',
          isAdmin: true,
          createdAt: now,
          updatedAt: now,
        });
      }
    })();
  }
  return migrationPromise;
}

export type SnippetWithTags = Snippet & { tags: Tag[] };

export type BootstrapData = {
  user: Awaited<ReturnType<typeof getAuthUser>>;
  workspaces: Workspace[];
  folders: Folder[];
  snippets: SnippetWithTags[];
  tags: Tag[];
  recentSnippets: SnippetWithTags[];
  favoriteSnippets: SnippetWithTags[];
  activeSnippetId: string | null;
};

async function loadSnippetTags(snippetIds: string[]) {
  if (snippetIds.length === 0) return new Map<string, Tag[]>();

  const rows = await db
    .select({
      snippetId: snippetTags.snippetId,
      tagId: tags.id,
      tagName: tags.name,
      tagColor: tags.color,
      tagCreatedAt: tags.createdAt,
      tagUserId: tags.userId,
    })
    .from(snippetTags)
    .innerJoin(tags, eq(snippetTags.tagId, tags.id))
    .where(inArray(snippetTags.snippetId, snippetIds));

  const map = new Map<string, Tag[]>();
  for (const row of rows) {
    const current = map.get(row.snippetId) ?? [];
    current.push({
      id: row.tagId,
      userId: row.tagUserId,
      name: row.tagName,
      color: row.tagColor,
      createdAt: row.tagCreatedAt,
    });
    map.set(row.snippetId, current);
  }
  return map;
}

export async function getBootstrapData(userId: string): Promise<BootstrapData> {
  await ensureDatabaseReady();

  const [workspacesList, foldersList, snippetsList, tagsList] = await Promise.all([
    db.select().from(workspaces).where(eq(workspaces.userId, userId)).orderBy(asc(workspaces.title)),
    db.select().from(folders).where(eq(folders.userId, userId)).orderBy(asc(folders.title)),
    db
      .select()
      .from(snippets)
      .where(eq(snippets.userId, userId))
      .orderBy(desc(snippets.updatedAt)),
    db.select().from(tags).where(eq(tags.userId, userId)).orderBy(asc(tags.name)),
  ]);

  const tagMap = await loadSnippetTags(snippetsList.map((snippet) => snippet.id));
  const snippetsWithTags = snippetsList.map((snippet) => ({
    ...snippet,
    tags: tagMap.get(snippet.id) ?? [],
  }));

  const recentSnippets = snippetsWithTags.slice(0, 8);
  const favoriteSnippets = snippetsWithTags.filter((snippet) => snippet.favorite);

  const activeSnippetId = snippetsWithTags[0]?.id ?? null;

  return {
    user: await getAuthUser(),
    workspaces: workspacesList,
    folders: foldersList,
    snippets: snippetsWithTags,
    tags: tagsList,
    recentSnippets,
    favoriteSnippets,
    activeSnippetId,
  };
}

export async function createDefaultWorkspaceAndSnippet(userId: string) {
  await ensureDatabaseReady();
  const now = new Date().toISOString();
  const workspaceId = newId();
  const snippetId = newId();

  await db.insert(workspaces).values({
    id: workspaceId,
    userId,
    title: 'Personal snippets',
    icon: '🧠',
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(snippets).values({
    id: snippetId,
    userId,
    workspaceId,
    folderId: null,
    title: 'Untitled snippet',
    icon: '📝',
    content: '',
    language: 'plain',
    favorite: false,
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
  });

  return { workspaceId, snippetId };
}

export async function searchSnippets(userId: string, query: string) {
  await ensureDatabaseReady();
  const trimmed = query.trim();
  if (!trimmed) return [];

  const pattern = `%${trimmed}%`;
  const byContent = await db
    .select()
    .from(snippets)
    .where(
      and(
        eq(snippets.userId, userId),
        or(
          like(snippets.title, pattern),
          like(snippets.content, pattern),
          like(snippets.language, pattern),
        ),
      ),
    )
    .orderBy(desc(snippets.updatedAt))
    .limit(20);

  const tagMatches = await db
    .select({
      snippet: snippets,
    })
    .from(snippets)
    .innerJoin(snippetTags, eq(snippets.id, snippetTags.snippetId))
    .innerJoin(tags, eq(snippetTags.tagId, tags.id))
    .where(and(eq(snippets.userId, userId), like(tags.name, pattern)))
    .orderBy(desc(snippets.updatedAt))
    .limit(20);

  const all = [...byContent, ...tagMatches.map((row) => row.snippet)];
  const deduped = Array.from(new Map(all.map((snippet) => [snippet.id, snippet])).values());
  const tagMap = await loadSnippetTags(deduped.map((snippet) => snippet.id));
  return deduped.map((snippet) => ({
    ...snippet,
    tags: tagMap.get(snippet.id) ?? [],
  }));
}
