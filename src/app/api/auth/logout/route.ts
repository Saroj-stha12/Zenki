import { clearUserSession } from '@/lib/session';
import { json } from '@/lib/http';

export async function POST() {
  await clearUserSession();
  return json({ ok: true });
}

