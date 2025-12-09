
'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { SessionData } from './session';

const fetchSession = async (): Promise<SessionData> => {
  const res = await fetch('/api/auth/session');
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch session: ${res.statusText} | ${text}`);
  }
  
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await res.text();
    throw new Error(`Expected JSON response, but got ${contentType}: ${text}`);
  }

  return res.json();
};

interface UseSessionOptions {
  required?: boolean;
  adminRequired?: boolean;
  redirectTo?: string;
}

export function useSession({ required = false, adminRequired = false, redirectTo = '/login' }: UseSessionOptions = {}) {
  const router = useRouter();
  const { data: session, isLoading, error } = useQuery<SessionData>({
    queryKey: ['session'],
    queryFn: fetchSession,
  });

  useEffect(() => {
    if (isLoading || error) return;

    if (required && !session?.isLoggedIn) {
      router.push(redirectTo);
    }
    
    if (adminRequired && !session?.isAdmin) {
      router.push('/admin'); // Redirect to the admin page which has the login
    }

  }, [session, isLoading, error, required, adminRequired, redirectTo, router]);

  return { session, isLoading, error };
}
