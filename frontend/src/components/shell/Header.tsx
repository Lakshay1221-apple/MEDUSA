'use client';

import React from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { LogOut, User as UserIcon, Bell } from 'lucide-react';
import Link from 'next/link';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 px-6 bg-surface/90 backdrop-blur border-b border-surface-border flex items-center justify-between shrink-0 select-none">
      {/* Active Mode / Command Banner */}
      <div className="flex items-center space-x-3">
        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-mono tracking-widest text-slate-300 uppercase">
          OPERATIONAL COMMAND
        </span>
      </div>

      {/* User Actions */}
      <div className="flex items-center space-x-4">
        {/* Notifications Quick Access */}
        <Link
          href="/notifications"
          className="relative p-2 rounded text-slate-400 hover:text-slate-200 hover:bg-surface-subtle transition-colors"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
        </Link>

        {/* User Pill */}
        <div className="flex items-center space-x-3 pl-3 border-l border-surface-border">
          <div className="flex flex-col text-right">
            <span className="text-xs font-mono font-semibold text-slate-200 uppercase tracking-tight">
              {user?.name || 'OPERATOR'}
            </span>
            <span className="text-[10px] font-mono text-slate-400 lowercase">
              {user?.email || 'authenticated'}
            </span>
          </div>
          <Link
            href="/settings"
            className="h-8 w-8 rounded bg-surface-subtle border border-surface-border flex items-center justify-center text-slate-300 hover:border-slate-500 transition-colors"
          >
            <UserIcon className="h-4 w-4" />
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-slate-400 hover:text-red-400 px-2"
            title="Log Out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
