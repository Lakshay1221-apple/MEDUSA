'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/AuthContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Skeleton } from '@/components/ui/Skeleton';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { status, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicRoute = pathname === '/login' || pathname === '/signup';

  useEffect(() => {
    if (!isLoading) {
      if (status === 'UNAUTHENTICATED' || status === 'SESSION_EXPIRED') {
        if (!isPublicRoute) {
          router.replace('/login');
        }
      } else if (status === 'AUTHENTICATED') {
        if (isPublicRoute) {
          router.replace('/dashboard');
        }
      }
    }
  }, [status, isLoading, isPublicRoute, router]);

  if (isPublicRoute) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  if (isLoading || status === 'AUTHENTICATING' || status === 'UNAUTHENTICATED') {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-sm w-full p-6">
          <div className="h-10 w-10 rounded bg-blue-600/20 border border-blue-500/50 flex items-center justify-center text-blue-400 font-mono font-black mx-auto animate-pulse">
            M
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4 mx-auto" />
            <Skeleton className="h-3 w-1/2 mx-auto" />
          </div>
          <p className="text-xs font-mono tracking-widest text-slate-500 uppercase animate-pulse">
            AUTHENTICATING OPERATOR...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-tactical-grid">{children}</main>
      </div>
    </div>
  );
}
