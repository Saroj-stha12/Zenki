import crypto from 'crypto';

import { and, eq } from 'drizzle-orm';

import { db } from '@/lib/db/client';
import { ensureDatabaseReady } from '@/lib/bootstrap';
import { folders, snippets, tags, snippetTags, workspaces } from '@/lib/db/schema';
import { getAuthUser } from '@/lib/session';
import { error, json } from '@/lib/http';
import { snippetUpdateSchema, tagListSchema } from '@/lib/validators';

type Params = {
  params: Promise<{ id: string }>;
};

async function loadSnippetOrThrow(id: string, userId: string) {
  const snippet = await db.query.snippets.findFirst({
    where: and(eq(snippets.id, id), eq(snippets.userId, userId)),
  });
  if (!snippet) return null;
  return snippet;
}

async function loadSnippetTags(id: string) {
  const rows = await db
    .select({
      tagId: tags.id,
      tagName: tags.name,
      tagColor: tags.color,
      tagCreatedAt: tags.createdAt,
      tagUserId: tags.userId,
    })
    .from(snippetTags)
    .innerJoin(tags, eq(snippetTags.tagId, tags.id))
    .where(eq(snippetTags.snippetId, id));

  return rows.map((row) => ({
    id: row.tagId,
    userId: row.tagUserId,
    name: row.tagName,
    color: row.tagColor,
    createdAt: row.tagCreatedAt,
  }));
}

export async function GET(_: Request, { params }: Params) {
  await ensureDatabaseReady();
  const user = await getAuthUser();
  if (!user) {
    return error('Unauthorized', 401);
  }
  const { id } = await params;
  const snippet = await loadSnippetOrThrow(id, user.id);
  if (!snippet) {
    return error('Snippet not found', 404);
  }
  return json({ snippet });
}

export async function PATCH(request: Request, { params }: Params) {
  await ensureDatabaseReady();
  const user = await getAuthUser();
  if (!user) {
    return error('Unauthorized', 401);
  }

  const { id } = await params;
  const parsed = snippetUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return error('Invalid snippet payload', 400, { issues: parsed.error.flatten() });
  }

  const current = await loadSnippetOrThrow(id, user.id);
  if (!current) {
    return error('Snippet not found', 404);
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

  const updated = {
    title: parsed.data.title ?? current.title,
    icon: parsed.data.icon ?? current.icon,
    content: parsed.data.content ?? current.content,
    language: parsed.data.language ?? current.language,
    favorite: parsed.data.favorite ?? current.favorite,
    workspaceId: parsed.data.workspaceId === undefined ? current.workspaceId : parsed.data.workspaceId,
    folderId: parsed.data.folderId === undefined ? current.folderId : parsed.data.folderId,
    updatedAt: new Date().toISOString(),
    lastOpenedAt: new Date().toISOString(),
  };

  await db.update(snippets).set(updated).where(eq(snippets.id, id));
  return json({ snippet: { ...current, ...updated } });
}

export async function DELETE(_: Request, { params }: Params) {
  await ensureDatabaseReady();
  const user = await getAuthUser();
  if (!user) {
    return error('Unauthorized', 401);
  }

  const { id } = await params;
  const current = await loadSnippetOrThrow(id, user.id);
  if (!current) {
    return error('Snippet not found', 404);
  }

  await db.delete(snippets).where(eq(snippets.id, id));
  return json({ ok: true });
}

export async function PUT(request: Request, { params }: Params) {
  await ensureDatabaseReady();
  const user = await getAuthUser();
  if (!user) {
    return error('Unauthorized', 401);
  }

  const { id } = await params;
  const parsed = tagListSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return error('Invalid tag payload', 400, { issues: parsed.error.flatten() });
  }

  const snippet = await loadSnippetOrThrow(id, user.id);
  if (!snippet) {
    return error('Snippet not found', 404);
  }

  const now = new Date().toISOString();
  const existingTags = await db.select().from(tags).where(eq(tags.userId, user.id));
  const existingByName = new Map(existingTags.map((tag) => [tag.name.toLowerCase(), tag]));
  const desiredTags = [];

  for (const name of parsed.data.tags) {
    const key = name.toLowerCase();
    const existing = existingByName.get(key);
    if (existing) {
      desiredTags.push(existing);
      continue;
    }

    const tag = {
      id: crypto.randomUUID(),
      userId: user.id,
      name,
      color: null,
      createdAt: now,
    };
    await db.insert(tags).values(tag);
    desiredTags.push(tag);
  }

  await db.delete(snippetTags).where(eq(snippetTags.snippetId, id));
  if (desiredTags.length > 0) {
    await db.insert(snippetTags).values(
      desiredTags.map((tag) => ({
        snippetId: id,
        tagId: tag.id,
      })),
    );
  }

  const tagsResult = await loadSnippetTags(id);
  return json({ ok: true, tags: tagsResult });
}
