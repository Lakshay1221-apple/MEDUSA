'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/classnames';
import {
  LayoutDashboard,
  Target,
  CheckSquare,
  Calendar,
  FileText,
  Clock,
  Repeat,
  Flame,
  Award,
  Github,
  BarChart2,
  Users,
  Bell,
  Settings,
  ShieldAlert,
  Zap,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Command Center', href: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Arcs', href: '/arcs', icon: <Target className="h-4 w-4" /> },
  { label: 'Tasks', href: '/tasks', icon: <CheckSquare className="h-4 w-4" /> },
  { label: 'Schedule', href: '/schedule', icon: <Calendar className="h-4 w-4" /> },
  { label: 'Documents & AI', href: '/documents', icon: <FileText className="h-4 w-4" /> },
  { label: 'Focus Sessions', href: '/focus', icon: <Clock className="h-4 w-4" /> },
  { label: 'Habits', href: '/habits', icon: <Repeat className="h-4 w-4" /> },
  { label: 'Accountability', href: '/accountability', icon: <ShieldAlert className="h-4 w-4" /> },
  { label: 'Score & Ledger', href: '/score', icon: <Zap className="h-4 w-4" /> },
  { label: 'Streaks', href: '/streaks', icon: <Flame className="h-4 w-4" /> },
  { label: 'Achievements', href: '/achievements', icon: <Award className="h-4 w-4" /> },
  { label: 'GitHub Verify', href: '/github', icon: <Github className="h-4 w-4" /> },
  { label: 'War Report & GitDot', href: '/analytics', icon: <BarChart2 className="h-4 w-4" /> },
  { label: 'Squad Workspaces', href: '/workspaces', icon: <Users className="h-4 w-4" /> },
  { label: 'Notifications', href: '/notifications', icon: <Bell className="h-4 w-4" /> },
  { label: 'Settings', href: '/settings', icon: <Settings className="h-4 w-4" /> },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-surface border-r border-surface-border flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-surface-border flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="h-7 w-7 rounded bg-blue-600/20 border border-blue-500/50 flex items-center justify-center text-blue-400 font-mono font-black text-sm">
            M
          </div>
          <div>
            <span className="font-mono font-bold tracking-widest text-sm text-slate-100">
              MEDUSA
            </span>
            <span className="block text-[9px] font-mono tracking-widest text-blue-400 uppercase -mt-0.5">
              Enforcement
            </span>
          </div>
        </div>
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-700/50">
          ONLINE
        </span>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded text-xs font-mono font-medium uppercase tracking-wider transition-all duration-150',
                isActive
                  ? 'bg-blue-950/70 text-blue-300 border border-blue-800/60 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-surface-subtle',
              )}
            >
              <span className={cn(isActive ? 'text-blue-400' : 'text-slate-500')}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Footer System Status */}
      <div className="p-4 border-t border-surface-border bg-surface-muted/30">
        <div className="text-[10px] font-mono text-slate-500 space-y-1">
          <div className="flex justify-between">
            <span>ENGINE</span>
            <span className="text-slate-300">v1.0.0-PROD</span>
          </div>
          <div className="flex justify-between">
            <span>AUTHORITY</span>
            <span className="text-emerald-400">SERVER-ENFORCED</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
