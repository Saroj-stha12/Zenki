import { getAuthUser } from '@/lib/session';
import { error, json } from '@/lib/http';
import { ensureDatabaseReady, searchSnippets } from '@/lib/bootstrap';
import { searchSchema } from '@/lib/validators';

export async function GET(request: Request) {
  await ensureDatabaseReady();
  const user = await getAuthUser();
  if (!user) {
    return error('Unauthorized', 401);
  }

  const { searchParams } = new URL(request.url);
  const parsed = searchSchema.safeParse({ q: searchParams.get('q') ?? '' });
  if (!parsed.success) {
    return error('Invalid search query', 400);
  }

  const results = await searchSnippets(user.id, parsed.data.q);
  return json({ results });
}

