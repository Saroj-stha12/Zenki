'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Mail, Lock, Check } from 'lucide-react';

type Mode = 'login' | 'register';

const field =
  'h-11 w-full border border-[color:var(--outline)] bg-[color:var(--background)] px-3 text-sm outline-none transition focus:border-[color:var(--btn)]';
const button =
  'inline-flex h-11 items-center justify-center gap-2 border border-[color:var(--outline)] bg-[color:var(--foreground)] px-4 text-sm font-medium text-[color:var(--background)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60';

export default function AuthScreen() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch(mode === 'login' ? '/api/auth/login' : '/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        displayName: mode === 'register' ? displayName : undefined,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? 'Authentication failed');
      return;
    }

    const payload = (await response.json()) as { user?: { isAdmin?: boolean } };
    if (mode === 'login' && payload.user?.isAdmin) {
      router.push('/admin');
      return;
    }

    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[color:var(--foreground)]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-10">
        <div className="grid w-full border border-[color:var(--outline)] bg-[color:var(--background)] shadow-sm lg:grid-cols-[1.1fr_0.9fr]">
          <section className="border-b border-[color:var(--outline)] p-8 lg:border-b-0 lg:border-r">
            <div className="max-w-lg space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center border border-[color:var(--outline)] bg-[color:var(--hover)]">
                  <Check className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--alt)]">zenki</p>
                  <h1 className="text-2xl font-semibold">Sign in to your snippets</h1>
                </div>
              </div>

              <p className="max-w-md text-sm leading-6 text-[color:var(--alt)]">
                Store code snippets, notes, folders, and workspace context in a single backend-backed app.
              </p>

              <div className="grid gap-3 text-sm">
                <div className="flex items-center gap-3 border border-[color:var(--outline)] px-3 py-2">
                  <Check className="h-4 w-4" />
                  JWT cookie sessions
                </div>
                <div className="flex items-center gap-3 border border-[color:var(--outline)] px-3 py-2">
                  <Check className="h-4 w-4" />
                  SQLite + Drizzle
                </div>
                <div className="flex items-center gap-3 border border-[color:var(--outline)] px-3 py-2">
                  <Check className="h-4 w-4" />
                  Monaco code editor and language presets
                </div>
              </div>
            </div>
          </section>

          <section className="p-8">
            <div className="mb-6 flex gap-2">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`h-10 flex-1 border px-3 text-sm transition ${
                  mode === 'login'
                    ? 'border-[color:var(--foreground)] bg-[color:var(--foreground)] text-[color:var(--background)]'
                    : 'border-[color:var(--outline)] bg-[color:var(--background)]'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`h-10 flex-1 border px-3 text-sm transition ${
                  mode === 'register'
                    ? 'border-[color:var(--foreground)] bg-[color:var(--foreground)] text-[color:var(--background)]'
                    : 'border-[color:var(--outline)] bg-[color:var(--background)]'
                }`}
              >
                Sign up
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {mode === 'register' ? (
                <label className="block space-y-2">
                  <span className="text-sm">Display name</span>
                  <input className={field} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" autoComplete="name" />
                </label>
              ) : null}

              <label className="block space-y-2">
                <span className="text-sm">Email</span>
                <div className="flex items-center gap-2 border border-[color:var(--outline)] bg-[color:var(--background)] px-3">
                  <Mail className="h-4 w-4 text-[color:var(--alt)]" />
                  <input
                    className="h-11 w-full bg-transparent text-sm outline-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="m@example.com"
                    autoComplete="email"
                    type="email"
                    required
                  />
                </div>
              </label>

              <label className="block space-y-2">
                <span className="text-sm">Password</span>
                <div className="flex items-center gap-2 border border-[color:var(--outline)] bg-[color:var(--background)] px-3">
                  <Lock className="h-4 w-4 text-[color:var(--alt)]" />
                  <input
                    className="h-11 w-full bg-transparent text-sm outline-none"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    type="password"
                    required
                  />
                </div>
              </label>

              {error ? <p className="border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700">{error}</p> : null}

              <button type="submit" disabled={loading} className={button + ' w-full'}>
                {loading ? 'Working...' : mode === 'login' ? 'Login' : 'Create account'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
