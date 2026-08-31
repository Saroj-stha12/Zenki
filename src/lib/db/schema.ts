import {
  integer,
  index,
  foreignKey,
  sqliteTable,
  text,
  uniqueIndex,
  primaryKey,
} from 'drizzle-orm/sqlite-core';

export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    displayName: text('display_name'),
    isAdmin: integer('is_admin', { mode: 'boolean' }).notNull().default(false),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [uniqueIndex('users_email_unique').on(table.email)],
);

export const sessions = sqliteTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: text('expires_at').notNull(),
    createdAt: text('created_at').notNull(),
    lastSeenAt: text('last_seen_at').notNull(),
    userAgent: text('user_agent'),
    ipAddress: text('ip_address'),
    revokedAt: text('revoked_at'),
  },
  (table) => [index('sessions_user_id_idx').on(table.userId)],
);

export const workspaces = sqliteTable(
  'workspaces',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    icon: text('icon').notNull().default('🗂️'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('workspaces_user_id_idx').on(table.userId),
    index('workspaces_title_idx').on(table.title),
    uniqueIndex('workspaces_user_id_id_unique').on(table.userId, table.id),
  ],
);

export const folders = sqliteTable(
  'folders',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    icon: text('icon').notNull().default('📁'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('folders_user_id_idx').on(table.userId),
    index('folders_workspace_id_idx').on(table.workspaceId),
    foreignKey({
      columns: [table.userId, table.workspaceId],
      foreignColumns: [workspaces.userId, workspaces.id],
      name: 'folders_user_id_workspace_id_workspaces_user_id_id_fk',
    }),
  ],
);

export const snippets = sqliteTable(
  'snippets',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    workspaceId: text('workspace_id')
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    folderId: text('folder_id').references(() => folders.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    icon: text('icon').notNull().default('📝'),
    content: text('content').notNull().default(''),
    language: text('language').notNull().default('plain'),
    favorite: integer('favorite', { mode: 'boolean' }).notNull().default(false),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    lastOpenedAt: text('last_opened_at'),
  },
  (table) => [
    index('snippets_user_id_idx').on(table.userId),
    index('snippets_workspace_id_idx').on(table.workspaceId),
    index('snippets_folder_id_idx').on(table.folderId),
    index('snippets_favorite_idx').on(table.favorite),
    index('snippets_title_idx').on(table.title),
  ],
);

export const tags = sqliteTable(
  'tags',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    color: text('color'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    uniqueIndex('tags_user_name_unique').on(table.userId, table.name),
    index('tags_user_id_idx').on(table.userId),
  ],
);

export const snippetTags = sqliteTable(
  'snippet_tags',
  {
    snippetId: text('snippet_id')
      .notNull()
      .references(() => snippets.id, { onDelete: 'cascade' }),
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.snippetId, table.tagId] }),
    index('snippet_tags_tag_id_idx').on(table.tagId),
  ],
);

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Workspace = typeof workspaces.$inferSelect;
export type Folder = typeof folders.$inferSelect;
export type Snippet = typeof snippets.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type SnippetTag = typeof snippetTags.$inferSelect;
