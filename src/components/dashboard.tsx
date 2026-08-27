'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  ChevronsUpDown,
  Copy,
  Folder,
  FolderPlus,
  LayoutDashboard,
  LogOut,
  Plus,
  Search,
  Star,
  StarOff,
  Trash2,
  X,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import CodeEditor from '@/components/code-editor';
import type { BootstrapData } from '@/lib/bootstrap';
import { SNIPPET_PRESETS, getSnippetPreset } from '@/lib/snippet-presets';

type Snippet = BootstrapData['snippets'][number];
type Workspace = BootstrapData['workspaces'][number];
type FolderType = BootstrapData['folders'][number];
type Tag = BootstrapData['tags'][number];

type Props = {
  initialData: BootstrapData;
  initialSelectedSnippetId: string | null;
};

type Draft = {
  title: string;
  content: string;
  language: string;
  icon: string;
  favorite: boolean;
  workspaceId: string | null;
  folderId: string | null;
};

type ModalKind = 'workspace' | 'folder' | 'snippet' | 'search' | null;

const shellButton =
  'inline-flex items-center gap-2 rounded-md border border-[color:var(--outline)] bg-[color:var(--background)] px-3 py-2 text-sm text-[color:var(--foreground)] transition hover:bg-[color:var(--hover)]';
const field =
  'h-10 w-full rounded-md border border-[color:var(--outline)] bg-[color:var(--background)] px-3 text-sm outline-none transition focus:border-[color:var(--btn)]';
const panel = 'border border-[color:var(--outline)] bg-[color:var(--background)]';

function Modal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 backdrop-blur-sm">
      <div className="w-full max-w-xl border border-[color:var(--outline)] bg-[color:var(--background)] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[color:var(--outline)] px-5 py-4">
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm text-[color:var(--alt)]">{subtitle}</p> : null}
          </div>
          <button className={shellButton} type="button" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function TreeButton({
  active,
  onClick,
  icon,
  title,
  suffix,
}: {
  active?: boolean;
  onClick: () => void;
  icon?: ReactNode;
  title: string;
  suffix?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition ${
        active ? 'bg-[color:var(--hover)]' : 'hover:bg-[color:var(--hover)]'
      }`}
    >
      <span className="flex items-center gap-2 min-w-0">
        {icon}
        <span className="truncate">{title}</span>
      </span>
      {suffix}
    </button>
  );
}

function pickWorkspaceId(data: BootstrapData, snippetId: string | null) {
  const snippet = data.snippets.find((item) => item.id === snippetId);
  return snippet?.workspaceId ?? data.workspaces[0]?.id ?? null;
}

export default function Dashboard({ initialData, initialSelectedSnippetId }: Props) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [selectedSnippetId, setSelectedSnippetId] = useState<string | null>(
    initialSelectedSnippetId ?? initialData.activeSnippetId,
  );
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(
    pickWorkspaceId(initialData, initialSelectedSnippetId ?? initialData.activeSnippetId),
  );
  const [modal, setModal] = useState<ModalKind>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Snippet[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [workspaceTitle, setWorkspaceTitle] = useState('');
  const [workspaceIcon, setWorkspaceIcon] = useState('WS');
  const [folderTitle, setFolderTitle] = useState('');
  const [folderIcon, setFolderIcon] = useState('FD');
  const [folderWorkspaceId, setFolderWorkspaceId] = useState(initialData.workspaces[0]?.id ?? '');
  const [snippetTitle, setSnippetTitle] = useState('');
  const [snippetIcon, setSnippetIcon] = useState('SN');
  const [snippetWorkspaceId, setSnippetWorkspaceId] = useState(initialData.workspaces[0]?.id ?? '');
  const [snippetFolderId, setSnippetFolderId] = useState('');
  const [snippetPresetId, setSnippetPresetId] = useState('plaintext');
  const [tagInput, setTagInput] = useState('');
  const [tagsDraft, setTagsDraft] = useState<string[]>([]);
  const [draft, setDraft] = useState<Draft>({
    title: '',
    content: '',
    language: 'plaintext',
    icon: 'SN',
    favorite: false,
    workspaceId: null,
    folderId: null,
  });
  const saveTimer = useRef<number | null>(null);

  const selectedSnippet = useMemo(
    () => data.snippets.find((snippet) => snippet.id === selectedSnippetId) ?? null,
    [data.snippets, selectedSnippetId],
  );

  const workspaces = data.workspaces;
  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? workspaces[0] ?? null;
  const visibleSnippets = data.snippets.filter(
    (snippet) => snippet.workspaceId === activeWorkspace?.id,
  );
  const rootSnippets = visibleSnippets.filter((snippet) => !snippet.folderId);
  const inboxSnippets = data.snippets.filter((snippet) => !snippet.workspaceId);
  const selectedFolder = selectedSnippet?.folderId
    ? data.folders.find((folder) => folder.id === selectedSnippet.folderId) ?? null
    : null;
  const selectedPreset = getSnippetPreset(
    SNIPPET_PRESETS.find((preset) => preset.language === draft.language)?.id ?? 'plaintext',
  );

  useEffect(() => {
    if (!selectedSnippet) return;
    setDraft({
      title: selectedSnippet.title,
      content: selectedSnippet.content,
      language: selectedSnippet.language,
      icon: selectedSnippet.icon,
      favorite: selectedSnippet.favorite,
      workspaceId: selectedSnippet.workspaceId ?? null,
      folderId: selectedSnippet.folderId ?? null,
    });
    setTagsDraft(selectedSnippet.tags.map((tag) => tag.name));
    setActiveWorkspaceId(selectedSnippet.workspaceId ?? data.workspaces[0]?.id ?? null);
  }, [selectedSnippet, data.workspaces]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        window.clearTimeout(saveTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (modal !== 'search') return;
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearchLoading(true);
      setSearchError(null);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`, {
          signal: controller.signal,
        });
        const payload = (await response.json().catch(() => null)) as
          | { results?: Snippet[]; error?: string }
          | null;
        if (!response.ok) {
          throw new Error(payload?.error ?? 'Search failed');
        }
        setSearchResults(payload?.results ?? []);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setSearchError((error as Error).message);
        }
      } finally {
        setSearchLoading(false);
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [modal, searchQuery]);

  async function refreshBootstrap() {
    const response = await fetch('/api/bootstrap', { cache: 'no-store' });
    const payload = (await response.json().catch(() => null)) as BootstrapData | { error?: string } | null;
    if (!response.ok) {
      throw new Error((payload as { error?: string } | null)?.error ?? 'Failed to refresh');
    }
    const bootstrap = payload as BootstrapData;
    setData(bootstrap);
    const nextWorkspaceId = pickWorkspaceId(bootstrap, selectedSnippetId);
    if (nextWorkspaceId) {
      setActiveWorkspaceId(nextWorkspaceId);
    }
    if (selectedSnippetId && !bootstrap.snippets.some((snippet) => snippet.id === selectedSnippetId)) {
      setSelectedSnippetId(bootstrap.activeSnippetId);
      if (bootstrap.activeSnippetId) {
        router.push(`/editor/${bootstrap.activeSnippetId}`);
      }
    }
  }

  function scheduleSnippetSave(next: Draft) {
    if (!selectedSnippetId) return;
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
    }

    saveTimer.current = window.setTimeout(async () => {
      const response = await fetch(`/api/snippets/${selectedSnippetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: next.title,
          content: next.content,
          language: next.language,
          icon: next.icon,
          favorite: next.favorite,
          workspaceId: next.workspaceId,
          folderId: next.folderId,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { snippet?: Snippet; error?: string }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Failed to save snippet');
      }
      if (payload?.snippet) {
        setData((previous) => ({
          ...previous,
          snippets: previous.snippets.map((snippet) =>
            snippet.id === payload.snippet?.id ? { ...payload.snippet!, tags: snippet.tags } : snippet,
          ),
        }));
      }
    }, 280);
  }

  async function updateDraft(patch: Partial<Draft>) {
    setDraft((previous) => {
      const next = { ...previous, ...patch };
      scheduleSnippetSave(next);
      return next;
    });
  }

  async function saveTags(nextTags: string[]) {
    if (!selectedSnippetId) return;
    const response = await fetch(`/api/snippets/${selectedSnippetId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags: nextTags }),
    });
    const payload = (await response.json().catch(() => null)) as
      | { tags?: Tag[]; error?: string }
      | null;
    if (!response.ok) {
      throw new Error(payload?.error ?? 'Failed to save tags');
    }

    const resolvedTags = payload?.tags ?? [];
    setData((previous) => ({
      ...previous,
      tags: resolvedTags.length > 0
        ? Array.from(
            new Map([...previous.tags, ...resolvedTags].map((tag) => [tag.id, tag])).values(),
          )
        : previous.tags.filter((tag) => nextTags.some((name) => tag.name === name)),
      snippets: previous.snippets.map((snippet) =>
        snippet.id === selectedSnippetId
          ? {
              ...snippet,
              tags: resolvedTags,
            }
          : snippet,
      ),
    }));
  }

  async function createWorkspace() {
    const response = await fetch('/api/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: workspaceTitle, icon: workspaceIcon }),
    });
    const payload = (await response.json().catch(() => null)) as
      | { workspace?: Workspace; error?: string }
      | null;
    if (!response.ok) throw new Error(payload?.error ?? 'Failed to create workspace');
    setWorkspaceTitle('');
    setModal(null);
    await refreshBootstrap();
  }

  async function createFolder() {
    const workspaceId = folderWorkspaceId || data.workspaces[0]?.id;
    if (!workspaceId) throw new Error('Create a workspace first');
    const response = await fetch('/api/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: folderTitle, icon: folderIcon, workspaceId }),
    });
    const payload = (await response.json().catch(() => null)) as
      | { folder?: FolderType; error?: string }
      | null;
    if (!response.ok) throw new Error(payload?.error ?? 'Failed to create folder');
    setFolderTitle('');
    setModal(null);
    await refreshBootstrap();
  }

  async function createSnippet() {
    const preset = getSnippetPreset(snippetPresetId);
    const workspaceId = snippetWorkspaceId || data.workspaces[0]?.id || null;
    const response = await fetch('/api/snippets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: snippetTitle || preset.label,
        icon: snippetIcon,
        content: preset.starter,
        language: preset.language,
        workspaceId,
        folderId: snippetFolderId || null,
      }),
    });
    const payload = (await response.json().catch(() => null)) as
      | { snippet?: Snippet; error?: string }
      | null;
    if (!response.ok) throw new Error(payload?.error ?? 'Failed to create snippet');
    setSnippetTitle('');
    setSnippetPresetId('plaintext');
    setModal(null);
    const created = payload?.snippet;
    if (created) {
      setData((previous) => ({
        ...previous,
        snippets: [{ ...created, tags: [] }, ...previous.snippets],
      }));
      setSelectedSnippetId(created.id);
      setActiveWorkspaceId(created.workspaceId ?? previousWorkspaceId(created, data));
      router.push(`/editor/${created.id}`);
    } else {
      await refreshBootstrap();
    }
  }

  function previousWorkspaceId(snippet: Snippet, source: BootstrapData) {
    return snippet.workspaceId ?? source.workspaces[0]?.id ?? null;
  }

  async function deleteFolder(folderId: string) {
    if (!confirm('Delete this folder and its snippets?')) return;
    const response = await fetch(`/api/folders/${folderId}`, { method: 'DELETE' });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error((payload as { error?: string } | null)?.error ?? 'Failed to delete folder');
    }
    await refreshBootstrap();
  }

  async function deleteSnippet(snippetId: string) {
    if (!confirm('Delete this snippet permanently?')) return;
    const response = await fetch(`/api/snippets/${snippetId}`, { method: 'DELETE' });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error((payload as { error?: string } | null)?.error ?? 'Failed to delete snippet');
    }
    const next = data.snippets.find((snippet) => snippet.id !== snippetId) ?? null;
    setSelectedSnippetId(next?.id ?? null);
    if (next) {
      router.push(`/editor/${next.id}`);
      setActiveWorkspaceId(next.workspaceId ?? data.workspaces[0]?.id ?? null);
    } else {
      router.push('/');
    }
    await refreshBootstrap();
  }

  async function copySnippet() {
    if (!selectedSnippet) return;
    await navigator.clipboard.writeText(draft.content);
  }

  async function toggleFavorite() {
    if (!selectedSnippet) return;
    await updateDraft({ favorite: !draft.favorite });
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.refresh();
  }

  function selectSnippet(snippetId: string) {
    setSelectedSnippetId(snippetId);
    const snippet = data.snippets.find((item) => item.id === snippetId);
    if (snippet?.workspaceId) {
      setActiveWorkspaceId(snippet.workspaceId);
    }
    router.push(`/editor/${snippetId}`);
  }

  const currentWorkspace = data.workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? null;
  const currentWorkspaceFolders = data.folders.filter((folder) => folder.workspaceId === currentWorkspace?.id);
  const currentWorkspaceSnippets = data.snippets.filter((snippet) => snippet.workspaceId === currentWorkspace?.id);
  const currentTags = tagsDraft;

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[color:var(--foreground)]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[20rem_1fr]">
        <aside className="flex min-h-screen flex-col border-r border-[color:var(--outline)] bg-[color:var(--sidebar)]">
          <div className="border-b border-[color:var(--outline)] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center border border-[color:var(--outline)] bg-[color:var(--background)]">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--alt)]">zenki</p>
                <h1 className="truncate text-sm font-medium">Snippet workspace</h1>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs uppercase tracking-[0.24em] text-[color:var(--alt)]">Workspace</span>
                <button className={shellButton} type="button" onClick={() => setModal('workspace')}>
                  <Plus className="h-4 w-4" />
                  New
                </button>
              </div>
              <div className="relative">
                <select
                  className={`${field} appearance-none pr-10`}
                  value={currentWorkspace?.id ?? ''}
                  onChange={(e) => setActiveWorkspaceId(e.target.value || null)}
                >
                  {data.workspaces.map((workspace) => (
                    <option key={workspace.id} value={workspace.id}>
                      {workspace.title}
                    </option>
                  ))}
                </select>
                <ChevronsUpDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--alt)]" />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1 text-xs uppercase tracking-[0.24em] text-[color:var(--alt)]">
                <span>Folders</span>
                <button className={shellButton} type="button" onClick={() => setModal('folder')}>
                  <FolderPlus className="h-4 w-4" />
                  New
                </button>
              </div>
              {currentWorkspace ? (
                <div className="space-y-1">
                  {currentWorkspaceFolders.length === 0 ? (
                    <p className="px-2 py-3 text-sm text-[color:var(--alt)]">No folders yet.</p>
                  ) : (
                    currentWorkspaceFolders.map((folder) => (
                      <div key={folder.id} className="space-y-1">
                        <TreeButton
                          title={folder.title}
                          icon={<Folder className="h-4 w-4 text-[color:var(--alt)]" />}
                          suffix={
                            <button
                              className="text-[color:var(--alt)]"
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                void deleteFolder(folder.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          }
                          onClick={() => {
                            const first = data.snippets.find((snippet) => snippet.folderId === folder.id);
                            if (first) selectSnippet(first.id);
                          }}
                        />
                        <div className="ml-4 space-y-1 border-l border-[color:var(--outline)] pl-3">
                          {data.snippets
                            .filter((snippet) => snippet.folderId === folder.id)
                            .map((snippet) => (
                              <TreeButton
                                key={snippet.id}
                                active={selectedSnippetId === snippet.id}
                                title={snippet.title}
                                onClick={() => selectSnippet(snippet.id)}
                                suffix={snippet.favorite ? <Star className="h-3.5 w-3.5" /> : null}
                              />
                            ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : null}

              <div className="pt-2">
                <div className="flex items-center justify-between px-1 text-xs uppercase tracking-[0.24em] text-[color:var(--alt)]">
                  <span>Files</span>
                  <button className={shellButton} type="button" onClick={() => setModal('snippet')}>
                    <Plus className="h-4 w-4" />
                    New
                  </button>
                </div>
                <div className="mt-2 space-y-1">
                  {(currentWorkspaceSnippets.length === 0 ? inboxSnippets : rootSnippets).map((snippet) => (
                    <TreeButton
                      key={snippet.id}
                      active={selectedSnippetId === snippet.id}
                      title={snippet.title}
                      onClick={() => selectSnippet(snippet.id)}
                      suffix={snippet.favorite ? <Star className="h-3.5 w-3.5" /> : null}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[color:var(--outline)] p-4">
            <div className="border border-[color:var(--outline)] bg-[color:var(--background)] p-3">
              <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--alt)]">Account</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{data.user?.displayName ?? data.user?.email}</div>
                  <div className="truncate text-xs text-[color:var(--alt)]">{data.user?.email}</div>
                </div>
                <button className={shellButton} type="button" onClick={logout}>
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex min-h-screen flex-col p-4 lg:p-6">
          <div className={`${panel} flex items-center justify-between gap-3 px-4 py-3`}>
            <div className="flex items-center gap-3 min-w-0">
              <button className={shellButton} type="button" onClick={() => router.push('/')}>
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--alt)]">Editor</p>
                <h2 className="truncate text-sm font-medium">
                  {selectedSnippet?.title ?? 'Pick a snippet from the sidebar'}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className={shellButton} type="button" onClick={() => setModal('search')}>
                <Search className="h-4 w-4" />
                Search
              </button>
              <button className={shellButton} type="button" onClick={copySnippet} disabled={!selectedSnippet}>
                <Copy className="h-4 w-4" />
                Copy
              </button>
              <button className={shellButton} type="button" onClick={toggleFavorite} disabled={!selectedSnippet}>
                {draft.favorite ? <StarOff className="h-4 w-4" /> : <Star className="h-4 w-4" />}
                {draft.favorite ? 'Unfavorite' : 'Favorite'}
              </button>
              <button className={shellButton} type="button" onClick={() => selectedSnippet && deleteSnippet(selectedSnippet.id)} disabled={!selectedSnippet}>
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>

          {selectedSnippet ? (
            <div className="mt-4 flex flex-1 flex-col gap-4">
              <section className={`${panel} p-4`}>
                <div className="grid gap-3 md:grid-cols-[1fr_10rem_12rem]">
                  <input
                    className={field}
                    value={draft.title}
                    onChange={(e) => updateDraft({ title: e.target.value })}
                    placeholder="Snippet title"
                  />
                  <input
                    className={field}
                    value={draft.icon}
                    onChange={(e) => updateDraft({ icon: e.target.value })}
                    placeholder="Icon"
                  />
                  <select
                    className={field}
                    value={SNIPPET_PRESETS.find((preset) => preset.language === draft.language)?.id ?? 'plaintext'}
                    onChange={(e) => {
                      const preset = getSnippetPreset(e.target.value);
                      setSnippetPresetId(preset.id);
                      void updateDraft({
                        language: preset.language,
                      });
                    }}
                  >
                    {SNIPPET_PRESETS.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.24em] text-[color:var(--alt)]">Workspace</span>
                    <select
                      className={field}
                      value={draft.workspaceId ?? ''}
                      onChange={(e) =>
                        updateDraft({
                          workspaceId: e.target.value || null,
                          folderId: null,
                        })
                      }
                    >
                      <option value="">Inbox</option>
                      {data.workspaces.map((workspace) => (
                        <option key={workspace.id} value={workspace.id}>
                          {workspace.title}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.24em] text-[color:var(--alt)]">Folder</span>
                    <select
                      className={field}
                      value={draft.folderId ?? ''}
                      onChange={(e) => updateDraft({ folderId: e.target.value || null })}
                    >
                      <option value="">None</option>
                      {data.folders
                        .filter((folder) => folder.workspaceId === (draft.workspaceId ?? currentWorkspace?.id))
                        .map((folder) => (
                          <option key={folder.id} value={folder.id}>
                            {folder.title}
                          </option>
                        ))}
                    </select>
                  </label>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {currentTags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-2 border border-[color:var(--outline)] px-2 py-1 text-xs">
                      #{tag}
                      <button
                        type="button"
                        onClick={() => {
                          const next = currentTags.filter((item) => item !== tag);
                          setTagsDraft(next);
                          void saveTags(next);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    className="h-9 min-w-[14rem] flex-1 border border-dashed border-[color:var(--outline)] bg-transparent px-3 text-sm outline-none"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const next = Array.from(
                          new Set([
                            ...currentTags,
                            ...tagInput
                              .split(',')
                              .map((item) => item.trim())
                              .filter(Boolean),
                          ]),
                        );
                        setTagInput('');
                        setTagsDraft(next);
                        void saveTags(next);
                      }
                    }}
                    placeholder="Add tags"
                  />
                </div>
              </section>

              <section className={`${panel} flex-1`}>
                <CodeEditor
                  value={draft.content}
                  language={draft.language}
                  onChange={(value) => void updateDraft({ content: value })}
                />
              </section>

              <div className="flex items-center justify-between text-xs text-[color:var(--alt)]">
                <div>
                  Updated{' '}
                  {selectedSnippet.updatedAt ? formatDistanceToNow(new Date(selectedSnippet.updatedAt), { addSuffix: true }) : 'just now'}
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-2 border border-[color:var(--outline)] px-2 py-1">
                    {selectedPreset.label}
                    <Check className="h-3 w-3" />
                  </span>
                  {currentWorkspace ? (
                    <span className="inline-flex items-center gap-2 border border-[color:var(--outline)] px-2 py-1">
                      {currentWorkspace.title}
                    </span>
                  ) : null}
                  {selectedFolder ? (
                    <span className="inline-flex items-center gap-2 border border-[color:var(--outline)] px-2 py-1">
                      {selectedFolder.title}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <div className={`${panel} mt-4 flex flex-1 items-center justify-center p-10 text-center`}>
              <div className="max-w-md space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center border border-[color:var(--outline)] bg-[color:var(--hover)]">
                  <Search className="h-5 w-5 text-[color:var(--alt)]" />
                </div>
                <h3 className="text-base font-medium">No snippet selected</h3>
                <p className="text-sm text-[color:var(--alt)]">
                  Create a new snippet or pick one from the workspace tree. Everything here is backed by SQLite.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {modal === 'workspace' ? (
        <Modal title="Create workspace" subtitle="Top-level organization for a project or client." onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-[1fr_8rem]">
              <input className={field} placeholder="Workspace title" value={workspaceTitle} onChange={(e) => setWorkspaceTitle(e.target.value)} />
              <input className={field} placeholder="Icon" value={workspaceIcon} onChange={(e) => setWorkspaceIcon(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <button className={shellButton} type="button" onClick={() => setModal(null)}>
                Cancel
              </button>
              <button className={shellButton} type="button" onClick={() => void createWorkspace()}>
                Save
              </button>
            </div>
          </div>
        </Modal>
      ) : null}

      {modal === 'folder' ? (
        <Modal title="Create folder" subtitle="Use folders to group related snippets inside a workspace." onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-[1fr_8rem]">
              <input className={field} placeholder="Folder title" value={folderTitle} onChange={(e) => setFolderTitle(e.target.value)} />
              <input className={field} placeholder="Icon" value={folderIcon} onChange={(e) => setFolderIcon(e.target.value)} />
            </div>
            <select className={field} value={folderWorkspaceId} onChange={(e) => setFolderWorkspaceId(e.target.value)}>
              {data.workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.title}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button className={shellButton} type="button" onClick={() => setModal(null)}>
                Cancel
              </button>
              <button className={shellButton} type="button" onClick={() => void createFolder()}>
                Save
              </button>
            </div>
          </div>
        </Modal>
      ) : null}

      {modal === 'snippet' ? (
        <Modal title="Create snippet" subtitle="Pick a coding preset to seed the editor and language." onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-[1fr_8rem]">
              <input className={field} placeholder="Snippet title" value={snippetTitle} onChange={(e) => setSnippetTitle(e.target.value)} />
              <input className={field} placeholder="Icon" value={snippetIcon} onChange={(e) => setSnippetIcon(e.target.value)} />
            </div>
            <select className={field} value={snippetPresetId} onChange={(e) => setSnippetPresetId(e.target.value)}>
              {SNIPPET_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label} {preset.extension}
                </option>
              ))}
            </select>
            <select className={field} value={snippetWorkspaceId} onChange={(e) => setSnippetWorkspaceId(e.target.value)}>
              <option value="">Inbox</option>
              {data.workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.title}
                </option>
              ))}
            </select>
            <select className={field} value={snippetFolderId} onChange={(e) => setSnippetFolderId(e.target.value)}>
              <option value="">None</option>
              {data.folders
                .filter((folder) => folder.workspaceId === snippetWorkspaceId)
                .map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.title}
                  </option>
                ))}
            </select>
            <div className="flex justify-end gap-2">
              <button className={shellButton} type="button" onClick={() => setModal(null)}>
                Cancel
              </button>
              <button className={shellButton} type="button" onClick={() => void createSnippet()}>
                Save
              </button>
            </div>
          </div>
        </Modal>
      ) : null}

      {modal === 'search' ? (
        <Modal title="Search snippets" subtitle="Search across titles, content, languages, and tags." onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="flex items-center gap-3 border border-[color:var(--outline)] px-3 py-2">
              <Search className="h-4 w-4 text-[color:var(--alt)]" />
              <input
                className="w-full bg-transparent text-sm outline-none"
                placeholder="Search snippets"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
            <div className="max-h-[50vh] space-y-2 overflow-y-auto">
              {searchLoading ? <p className="text-sm text-[color:var(--alt)]">Searching...</p> : null}
              {searchError ? <p className="text-sm text-red-600">{searchError}</p> : null}
              {!searchLoading && searchResults.length === 0 && searchQuery.trim() ? (
                <p className="text-sm text-[color:var(--alt)]">No results found.</p>
              ) : null}
              {searchResults.map((snippet) => (
                <button
                  key={snippet.id}
                  type="button"
                  onClick={() => {
                    setModal(null);
                    selectSnippet(snippet.id);
                  }}
                  className="flex w-full items-center justify-between border border-[color:var(--outline)] px-3 py-3 text-left transition hover:bg-[color:var(--hover)]"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span>{snippet.icon}</span>
                      <span className="text-sm font-medium">{snippet.title}</span>
                    </div>
                    <p className="text-xs text-[color:var(--alt)]">
                      {snippet.language} {snippet.tags.length > 0 ? `· ${snippet.tags.map((tag) => `#${tag.name}`).join(' ')}` : ''}
                    </p>
                  </div>
                  <span className="text-xs text-[color:var(--alt)]">
                    {formatDistanceToNow(new Date(snippet.updatedAt), { addSuffix: true })}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
