import { getAuthUser } from '@/lib/session';
import { ensureDatabaseReady, getBootstrapData } from '@/lib/bootstrap';
import { error, json } from '@/lib/http';

export async function GET() {
  await ensureDatabaseReady();
  const user = await getAuthUser();
  if (!user) {
    return error('Unauthorized', 401);
  }

  const bootstrap = await getBootstrapData(user.id);
  return json(bootstrap);
}

