import { eq } from 'drizzle-orm';

import { db } from '@/lib/db/client';
import { ensureDatabaseReady, getBootstrapData } from '@/lib/bootstrap';
import { users } from '@/lib/db/schema';
import { createUserSession, verifyPassword } from '@/lib/session';
import { error, json } from '@/lib/http';
import { authSchema } from '@/lib/validators';

export async function POST(request: Request) {
  await ensureDatabaseReady();

  const payload = authSchema.omit({ displayName: true }).safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return error('Invalid login payload', 400, { issues: payload.error.flatten() });
  }

  const email = payload.data.email.toLowerCase();
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user) {
    return error('Invalid email or password', 401);
  }

  const valid = await verifyPassword(payload.data.password, user.passwordHash);
  if (!valid) {
    return error('Invalid email or password', 401);
  }

  await createUserSession(user, request);
  const bootstrap = await getBootstrapData(user.id);
  return json({ user: bootstrap.user, bootstrap });
}
