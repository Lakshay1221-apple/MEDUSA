'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/AuthContext';

export default function RootPage() {
  const { status, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (status === 'AUTHENTICATED') {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [status, isLoading, router]);

  return null;
}
