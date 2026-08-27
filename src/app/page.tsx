import AuthScreen from '@/components/auth-screen';
import Dashboard from '@/components/dashboard';
import { ensureDatabaseReady, getBootstrapData } from '@/lib/bootstrap';
import { getAuthUser } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  await ensureDatabaseReady();
  const user = await getAuthUser();

  if (!user) {
    return <AuthScreen />;
  }

  if (user.isAdmin) {
    redirect('/admin');
  }

  const bootstrap = await getBootstrapData(user.id);
  return <Dashboard initialData={bootstrap} initialSelectedSnippetId={bootstrap.activeSnippetId} />;
}
