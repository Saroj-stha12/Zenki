import 'server-only';

import crypto from 'crypto';
import { SignJWT, jwtVerify } from 'jose';
import { cookies, headers } from 'next/headers';
import { and, eq, isNull } from 'drizzle-orm';

import { db } from '@/lib/db/client';
import { env } from '@/lib/env';
import { sessions, users, type User } from '@/lib/db/schema';

export const SESSION_COOKIE = 'zenki_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

function secretKey() {
  return new TextEncoder().encode(env.JWT_SECRET);
}

function getRequestUrl(request?: Request) {
  if (!request) return null;
  try {
    return new URL(request.url);
  } catch {
    return null;
  }
}

function isHttpsRequest(request?: Request) {
  const url = getRequestUrl(request);
  if (!url) return false;

  const forwardedProto = request?.headers.get('x-forwarded-proto')?.split(',')[0]?.trim().toLowerCase();
  if (forwardedProto) {
    return forwardedProto === 'https';
  }

  return url.protocol === 'https:';
}

function isCrossOriginRequest(request?: Request) {
  const url = getRequestUrl(request);
  if (!url) return false;

  const origin = request?.headers.get('origin');
  if (!origin) return false;

  try {
    return new URL(origin).origin !== url.origin;
  } catch {
    return false;
  }
}

function getSessionCookieOptions(request: Request | undefined, expiresAt: Date) {
  const secure = isHttpsRequest(request);
  const crossOrigin = isCrossOriginRequest(request);
  const sameSite: 'lax' | 'none' = secure && crossOrigin ? 'none' : 'lax';

  return {
    httpOnly: true,
    // Cross-origin credentialed requests need SameSite=None, but that only
    // works when the browser is also on HTTPS. For plain EC2 HTTP access,
    // keep the cookie usable by staying on Lax.
    sameSite,
    secure,
    path: '/',
    expires: expiresAt,
  };
}

export function newId() {
  return crypto.randomUUID();
}

export async function hashPassword(password: string) {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: {
  userId: string;
  email: string;
  sessionId: string;
}) {
  return new SignJWT({ email: payload.email, sid: payload.sessionId })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(payload.userId)
    .setJti(payload.sessionId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySessionToken(token: string) {
  const result = await jwtVerify(token, secretKey());
  return result.payload;
}

export async function createUserSession(user: User, request?: Request) {
  const sessionId = newId();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_SECONDS * 1000);
  const headerStore = request ? request.headers : await headers();
  const token = await createSessionToken({
    userId: user.id,
    email: user.email,
    sessionId,
  });

  await db.insert(sessions).values({
    id: sessionId,
    userId: user.id,
    createdAt: now.toISOString(),
    lastSeenAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    userAgent: headerStore.get('user-agent'),
    ipAddress: headerStore.get('x-forwarded-for') ?? headerStore.get('x-real-ip'),
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, getSessionCookieOptions(request, expiresAt));

  return { token, sessionId, expiresAt };
}

export async function clearUserSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    try {
      const payload = await verifySessionToken(token);
      const sessionId = payload.jti ?? (payload.sid as string | undefined);
      if (sessionId) {
        await db
          .update(sessions)
          .set({ revokedAt: new Date().toISOString() })
          .where(eq(sessions.id, sessionId));
      }
    } catch {
      // ignore invalid cookie on logout
    }
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const payload = await verifySessionToken(token);
    const sessionId = payload.jti ?? (payload.sid as string | undefined);
    const userId = payload.sub;
    if (!sessionId || !userId) return null;

    const session = await db.query.sessions.findFirst({
      where: and(eq(sessions.id, sessionId), eq(sessions.userId, userId), isNull(sessions.revokedAt)),
    });
    if (!session) return null;

    const user = await db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then((rows) => rows[0]);
    if (!user) return null;

    await db
      .update(sessions)
      .set({ lastSeenAt: new Date().toISOString() })
      .where(eq(sessions.id, sessionId));

    return user;
  } catch {
    return null;
  }
}
