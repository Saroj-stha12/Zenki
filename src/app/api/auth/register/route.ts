import { eq } from 'drizzle-orm';

import { db } from '@/lib/db/client';
import { createDefaultWorkspaceAndSnippet, ensureDatabaseReady, getBootstrapData } from '@/lib/bootstrap';
import { users } from '@/lib/db/schema';
import { createUserSession, hashPassword, newId } from '@/lib/session';
import { error, json } from '@/lib/http';
import { authSchema } from '@/lib/validators';
import { env } from '@/lib/env';

export async function POST(request: Request) {
  await ensureDatabaseReady();

  const payload = authSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return error('Invalid registration payload', 400, { issues: payload.error.flatten() });
  }

  const email = payload.data.email.toLowerCase();
  if (email === env.ADMIN_EMAIL.toLowerCase()) {
    return error('This email address is reserved', 403);
  }
  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) {
    return error('An account already exists for this email', 409);
  }

  const now = new Date().toISOString();
  const user = {
    id: newId(),
    email,
    passwordHash: await hashPassword(payload.data.password),
    displayName: payload.data.displayName ?? null,
    isAdmin: false,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(users).values(user);
  await createDefaultWorkspaceAndSnippet(user.id);
  await createUserSession(user, request);

  const bootstrap = await getBootstrapData(user.id);
  return json({ user: bootstrap.user, bootstrap }, { status: 201 });
}
