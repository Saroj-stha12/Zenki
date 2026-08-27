import Dashboard from '@/components/dashboard';
import AuthScreen from '@/components/auth-screen';
import { ensureDatabaseReady, getBootstrapData } from '@/lib/bootstrap';
import { getAuthUser } from '@/lib/session';

type Props = {
  params: Promise<{ uuid: string }>;
};

export default async function EditorPage({ params }: Props) {
  await ensureDatabaseReady();
  const user = await getAuthUser();

  if (!user) {
    return <AuthScreen />;
  }

  const bootstrap = await getBootstrapData(user.id);
  const { uuid } = await params;
  return <Dashboard initialData={bootstrap} initialSelectedSnippetId={uuid} />;
}
