import { getAuthUser } from '@/lib/session';
import { error, json } from '@/lib/http';

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return error('Unauthorized', 401);
  }
  return json({ user });
}

