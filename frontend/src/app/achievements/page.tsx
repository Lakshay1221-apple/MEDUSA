'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '@/components/shell/AppShell';
import { achievementsApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/query/keys';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDate } from '@/lib/utils/formatters';
import { Award, CheckCircle2, Lock, Zap } from 'lucide-react';

export default function AchievementsPage() {
  const { data: achievements = [], isLoading } = useQuery({
    queryKey: queryKeys.achievements.all,
    queryFn: () => achievementsApi.list(),
  });

  const unlockedCount = achievements.filter((a) => a.is_unlocked).length;

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto font-mono">
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-surface-border">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wider text-slate-100">
              OPERATIONAL ACHIEVEMENTS
            </h1>
            <p className="text-xs text-slate-400">
              Deterministic milestone unlocks separate from behavioral tags.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs text-purple-400 font-bold bg-purple-950/60 border border-purple-800/60 px-3 py-1.5 rounded">
            <Award className="h-4 w-4" />
            <span>
              UNLOCKED: {unlockedCount} / {achievements.length}
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((ach) => (
              <Card
                key={ach.key}
                className={`p-5 space-y-3 border ${
                  ach.is_unlocked
                    ? 'bg-purple-950/30 border-purple-800/70 text-purple-200'
                    : 'bg-surface-muted border-surface-border opacity-60 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {ach.is_unlocked ? (
                      <CheckCircle2 className="h-5 w-5 text-purple-400" />
                    ) : (
                      <Lock className="h-5 w-5 text-slate-600" />
                    )}
                    <span className="font-bold text-sm tracking-wider uppercase">
                      {ach.title}
                    </span>
                  </div>

                  <span className="flex items-center space-x-1 text-xs font-bold text-amber-400">
                    <Zap className="h-3 w-3" />
                    <span>+{ach.points} PTS</span>
                  </span>
                </div>

                <p className="text-xs text-slate-300 font-normal leading-relaxed">
                  {ach.description}
                </p>

                <div className="pt-2 border-t border-surface-border text-[10px] text-slate-500 flex justify-between">
                  <span>KEY: {ach.key}</span>
                  {ach.is_unlocked && ach.unlocked_at && (
                    <span className="text-purple-300">
                      UNLOCKED {formatDate(ach.unlocked_at, 'MMM dd, yyyy')}
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
