'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '@/components/shell/AppShell';
import { arcsApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/query/keys';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Flame, Award, CheckCircle2, Circle } from 'lucide-react';

const MILESTONES = [3, 7, 14, 21, 30, 50, 75, 100, 150, 365];

export default function StreaksPage() {
  const { data: arcs = [], isLoading } = useQuery({
    queryKey: queryKeys.arcs.all,
    queryFn: () => arcsApi.list(),
  });
  const activeArc = arcs[0];

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppShell>
    );
  }

  if (!activeArc) {
    return (
      <AppShell>
        <div className="py-16 text-center font-mono text-slate-400">NO ACTIVE ARC REGISTERED</div>
      </AppShell>
    );
  }

  const currentStreak = activeArc.user_stats?.current_streak || 0;
  const longestStreak = activeArc.user_stats?.longest_streak || 0;

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto font-mono">
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-surface-border">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wider text-slate-100">
              EXECUTION STREAKS & MOMENTUM
            </h1>
            <p className="text-xs text-slate-400">
              Daily closure enforcement. Streaks increment on complete execution and reset immediately on skip or missed closure.
            </p>
          </div>
        </div>

        {/* Top Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="p-6 border-surface-border">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
              <span>CURRENT UNBROKEN STREAK</span>
              <Flame className="h-5 w-5 text-orange-400" />
            </div>
            <div className="text-4xl font-black text-slate-100 mt-2">
              {currentStreak} <span className="text-sm font-normal text-slate-500">DAYS</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Active consecutive daily closures</p>
          </Card>

          <Card className="p-6 border-surface-border">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
              <span>LONGEST ALL-TIME STREAK</span>
              <Award className="h-5 w-5 text-amber-400" />
            </div>
            <div className="text-4xl font-black text-slate-100 mt-2">
              {longestStreak} <span className="text-sm font-normal text-slate-500">DAYS</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Peak discipline record</p>
          </Card>
        </div>

        {/* Milestone Progression Grid */}
        <Card className="p-5 space-y-4">
          <CardHeader>
            <CardTitle>STREAK MILESTONES & BADGES</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {MILESTONES.map((days) => {
                const isReached = currentStreak >= days;
                return (
                  <div
                    key={days}
                    className={`p-4 rounded border text-center space-y-2 ${
                      isReached
                        ? 'bg-orange-950/40 border-orange-700/60 text-orange-300'
                        : 'bg-surface-muted border-surface-border text-slate-500 opacity-60'
                    }`}
                  >
                    <div className="flex justify-center">
                      {isReached ? (
                        <CheckCircle2 className="h-6 w-6 text-orange-400" />
                      ) : (
                        <Circle className="h-6 w-6 text-slate-600" />
                      )}
                    </div>
                    <div className="text-lg font-black">{days} DAYS</div>
                    <div className="text-[10px] uppercase font-bold tracking-wider">
                      {isReached ? 'UNLOCKED' : 'LOCKED'}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
