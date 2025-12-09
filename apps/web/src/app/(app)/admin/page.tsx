
'use client';

import { useSession } from '@/lib/hooks';
import AdminInterface from '@/components/admin-interface';
import AdminLogin from '@/components/admin-login';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminPage() {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return (
        <div className="container mx-auto p-4">
            <Skeleton className="h-64 w-full" />
        </div>
    );
  }

  return (
    <main>
      {session?.isAdmin ? <AdminInterface /> : <AdminLogin />}
    </main>
  );
}
