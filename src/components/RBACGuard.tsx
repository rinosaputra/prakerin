import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

interface RBACGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export default async function RBACGuard({ allowedRoles, children }: RBACGuardProps) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (!allowedRoles.includes(session.payload.role)) {
    redirect('/unauthorized');
  }

  return <>{children}</>;
}
