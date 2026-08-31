import { readFileSync } from 'node:fs';

import { Database } from 'bun:sqlite';
import { expect, test } from 'bun:test';

function runMigration(db: Database, filePath: string) {
  const sql = readFileSync(filePath, 'utf8');
  const statements = sql
    .split('--> statement-breakpoint')
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    db.exec(statement);
  }
}

function createDatabase() {
  const db = new Database(':memory:');
  db.exec('PRAGMA foreign_keys = ON;');
  runMigration(db, new URL('../drizzle/0000_initial_schema.sql', import.meta.url));
  runMigration(db, new URL('../drizzle/0001_folder_workspace_owner.sql', import.meta.url));
  return db;
}

function seedUser(db: Database, id: string, email: string) {
  db.prepare(
    'INSERT INTO users (id, email, password_hash, display_name, is_admin, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(id, email, 'hash', null, 0, '2026-08-31T00:00:00.000Z', '2026-08-31T00:00:00.000Z');
}

function seedWorkspace(db: Database, id: string, userId: string) {
  db.prepare(
    'INSERT INTO workspaces (id, user_id, title, icon, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(id, userId, 'Workspace', '🗂️', '2026-08-31T00:00:00.000Z', '2026-08-31T00:00:00.000Z');
}

test('allows a folder and workspace owned by the same user', () => {
  const db = createDatabase();
  seedUser(db, 'user-a', 'a@example.com');
  seedWorkspace(db, 'workspace-a', 'user-a');

  expect(() =>
    db.prepare(
      'INSERT INTO folders (id, user_id, workspace_id, title, icon, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ).run('folder-a', 'user-a', 'workspace-a', 'Folder', '📁', '2026-08-31T00:00:00.000Z', '2026-08-31T00:00:00.000Z'),
  ).not.toThrow();

  const folder = db.prepare('SELECT user_id, workspace_id FROM folders WHERE id = ?').get('folder-a') as
    | { user_id: string; workspace_id: string }
    | undefined;

  expect(folder).toEqual({ user_id: 'user-a', workspace_id: 'workspace-a' });
  db.close();
});

test('rejects a folder linked to another user\'s workspace', () => {
  const db = createDatabase();
  seedUser(db, 'user-a', 'a@example.com');
  seedUser(db, 'user-b', 'b@example.com');
  seedWorkspace(db, 'workspace-a', 'user-a');

  expect(() =>
    db.prepare(
      'INSERT INTO folders (id, user_id, workspace_id, title, icon, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ).run('folder-bad', 'user-b', 'workspace-a', 'Folder', '📁', '2026-08-31T00:00:00.000Z', '2026-08-31T00:00:00.000Z'),
  ).toThrow();

  db.close();
});
