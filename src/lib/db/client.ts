import 'server-only';

import { createClient } from '@libsql/client/node';
import { drizzle } from 'drizzle-orm/libsql/node';
import { env } from '@/lib/env';
import * as schema from './schema';

const client = createClient({ url: env.DATABASE_URL });

export const db = drizzle({ client, schema });
export { client };
