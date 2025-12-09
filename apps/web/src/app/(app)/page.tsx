
'use client';

import { useSession } from '@/lib/hooks';
import MainInterface from '@/components/main-interface';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const { session, isLoading } = useSession({ required: true });

  if (isLoading || !session?.isLoggedIn) {
    return (
      <div className="container mx-auto p-4">
        <Skeleton className="h-8 w-1/2 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Skeleton className="h-64 w-full" />
          </div>
          <div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <main>
      <MainInterface officerName={session.officerName!} />
    </main>
  );
}
