'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Boxes,
  Code2,
  FolderTree,
  LogOut,
  Search,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react';

import type { AdminOverview } from '@/lib/admin';

type Props = {
  admin: { id: string; email: string; displayName: string | null };
  initialData: AdminOverview;
};

type View = 'users' | 'workspaces';

const button =
  'inline-flex h-10 items-center justify-center gap-2 border border-[color:var(--outline)] px-3 text-sm transition hover:bg-[color:var(--hover)] disabled:cursor-not-allowed disabled:opacity-50';

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  );
}

export default function AdminDashboard({ admin, initialData }: Props) {
  const [data, setData] = useState(initialData);
  const [view, setView] = useState<View>('users');
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const visibleUsers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return data.users;
    return data.users.filter(
      (user) =>
        user.email.toLowerCase().includes(needle) ||
        user.displayName?.toLowerCase().includes(needle),
    );
  }, [data.users, query]);

  const visibleWorkspaces = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return data.workspaces;
    return data.workspaces.filter(
      (workspace) =>
        workspace.title.toLowerCase().includes(needle) ||
        workspace.ownerEmail.toLowerCase().includes(needle),
    );
  }, [data.workspaces, query]);

  async function refreshOverview() {
    const response = await fetch('/api/admin/overview', { cache: 'no-store' });
    if (!response.ok) throw new Error('Could not refresh admin data');
    setData((await response.json()) as AdminOverview);
  }

  async function remove(kind: 'users' | 'workspaces', id: string, label: string) {
    const detail =
      kind === 'users'
        ? 'This permanently deletes the user and every workspace, folder, snippet, tag, and session they own.'
        : 'This permanently deletes the workspace and every folder and snippet inside it.';
    if (!window.confirm(`Delete ${label}?\n\n${detail}`)) return;

    setBusyId(id);
    setError(null);
    const response = await fetch(`/api/admin/${kind}/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? 'Delete failed');
      setBusyId(null);
      return;
    }

    try {
      await refreshOverview();
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'Could not refresh admin data');
    } finally {
      setBusyId(null);
    }
  }

  async function logout() {
    setBusyId('logout');
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  const cards = [
    { label: 'Users', value: data.totals.users, icon: Users },
    { label: 'Workspaces', value: data.totals.workspaces, icon: Boxes },
    { label: 'Folders', value: data.totals.folders, icon: FolderTree },
    { label: 'Snippets', value: data.totals.snippets, icon: Code2 },
  ];

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[color:var(--foreground)]">
      <header className="border-b border-[color:var(--outline)] bg-[color:var(--background)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center bg-[color:var(--foreground)] text-[color:var(--background)]">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--alt)]">Zenki</p>
              <h1 className="font-semibold">Administration</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{admin.displayName ?? 'Administrator'}</p>
              <p className="text-xs text-[color:var(--alt)]">{admin.email}</p>
            </div>
            <button className={button} type="button" disabled={busyId === 'logout'} onClick={logout}>
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-5 py-8">
        <section>
          <p className="text-sm text-[color:var(--alt)]">System overview</p>
          <h2 className="mt-1 text-2xl font-semibold">Content and account moderation</h2>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(({ label, value, icon: Icon }) => (
            <article key={label} className="border border-[color:var(--outline)] bg-[color:var(--background)] p-5">
              <div className="flex items-center justify-between text-[color:var(--alt)]">
                <span className="text-sm">{label}</span>
                <Icon className="h-4 w-4" />
              </div>
              <p className="mt-4 text-3xl font-semibold">{value}</p>
            </article>
          ))}
        </section>

        <section className="border border-[color:var(--outline)] bg-[color:var(--background)]">
          <div className="flex flex-col gap-4 border-b border-[color:var(--outline)] p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-2">
              {(['users', 'workspaces'] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => { setView(item); setQuery(''); }}
                  className={`${button} ${view === item ? 'bg-[color:var(--foreground)] text-[color:var(--background)] hover:bg-[color:var(--foreground)]' : ''}`}
                >
                  {item === 'users' ? <Users className="h-4 w-4" /> : <Boxes className="h-4 w-4" />}
                  {item === 'users' ? 'Users' : 'Workspaces'}
                </button>
              ))}
            </div>
            <label className="flex h-10 min-w-72 items-center gap-2 border border-[color:var(--outline)] px-3">
              <Search className="h-4 w-4 text-[color:var(--alt)]" />
              <input
                className="w-full bg-transparent text-sm outline-none"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={view === 'users' ? 'Search users' : 'Search workspace or owner'}
              />
            </label>
          </div>

          {error ? <p className="m-4 border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700">{error}</p> : null}

          <div className="overflow-x-auto">
            {view === 'users' ? (
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="border-b border-[color:var(--outline)] text-xs uppercase tracking-wider text-[color:var(--alt)]">
                  <tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Created</th><th className="px-4 py-3">Workspaces</th><th className="px-4 py-3">Folders</th><th className="px-4 py-3">Snippets</th><th className="px-4 py-3 text-right">Action</th></tr>
                </thead>
                <tbody>
                  {visibleUsers.map((user) => (
                    <tr key={user.id} className="border-b border-[color:var(--outline)] last:border-0">
                      <td className="px-4 py-4"><p className="font-medium">{user.displayName ?? 'Unnamed user'}</p><p className="text-xs text-[color:var(--alt)]">{user.email}</p></td>
                      <td className="px-4 py-4 text-[color:var(--alt)]">{formatDate(user.createdAt)}</td>
                      <td className="px-4 py-4">{user.workspaceCount}</td><td className="px-4 py-4">{user.folderCount}</td><td className="px-4 py-4">{user.snippetCount}</td>
                      <td className="px-4 py-4 text-right">
                        {user.isAdmin ? <span className="inline-flex items-center gap-1 text-xs font-medium"><ShieldCheck className="h-4 w-4" /> Protected admin</span> : (
                          <button className={`${button} border-red-500/30 text-red-700 hover:bg-red-500/10`} disabled={busyId !== null} onClick={() => remove('users', user.id, user.email)}><Trash2 className="h-4 w-4" /> Delete user</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="border-b border-[color:var(--outline)] text-xs uppercase tracking-wider text-[color:var(--alt)]">
                  <tr><th className="px-4 py-3">Workspace</th><th className="px-4 py-3">Owner</th><th className="px-4 py-3">Created</th><th className="px-4 py-3">Folders</th><th className="px-4 py-3">Snippets</th><th className="px-4 py-3 text-right">Action</th></tr>
                </thead>
                <tbody>
                  {visibleWorkspaces.map((workspace) => (
                    <tr key={workspace.id} className="border-b border-[color:var(--outline)] last:border-0">
                      <td className="px-4 py-4 font-medium">{workspace.icon} {workspace.title}</td><td className="px-4 py-4 text-[color:var(--alt)]">{workspace.ownerEmail}</td><td className="px-4 py-4 text-[color:var(--alt)]">{formatDate(workspace.createdAt)}</td><td className="px-4 py-4">{workspace.folderCount}</td><td className="px-4 py-4">{workspace.snippetCount}</td>
                      <td className="px-4 py-4 text-right"><button className={`${button} border-red-500/30 text-red-700 hover:bg-red-500/10`} disabled={busyId !== null} onClick={() => remove('workspaces', workspace.id, workspace.title)}><Trash2 className="h-4 w-4" /> Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
