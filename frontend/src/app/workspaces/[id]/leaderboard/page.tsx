'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '@/components/shell/AppShell';
import { workspacesApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/query/keys';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { ArrowLeft, Trophy, Flame, Zap, Shield, CheckSquare } from 'lucide-react';

export default function WorkspaceLeaderboardPage() {
  const params = useParams();
  const workspaceId = params.id as string;

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.workspaces.leaderboard(workspaceId),
    queryFn: () => workspacesApi.getLeaderboard(workspaceId),
    enabled: !!workspaceId,
  });

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell>
        <div className="py-16 text-center font-mono text-slate-400">WORKSPACE NOT FOUND</div>
      </AppShell>
    );
  }

  const { workspace, leaderboard } = data;

  return (
    <AppShell>
      <div className="space-y-6 max-w-6xl mx-auto font-mono">
        <Link
          href="/workspaces"
          className="inline-flex items-center space-x-2 text-xs text-slate-400 hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>BACK TO SQUADS</span>
        </Link>

        {/* Squad Header */}
        <Card className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">
                  SQUAD
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  INVITE CODE: {workspace.invite_code}
                </span>
              </div>
              <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-100 mt-1">
                {workspace.name}
              </h1>
            </div>

            <div className="text-xs text-slate-400 flex items-center space-x-2 bg-surface-muted p-2 rounded border border-surface-border">
              <Shield className="h-4 w-4 text-emerald-400" />
              <span>PRIVACY ENFORCED: Personal notes & tasks remain strictly private</span>
            </div>
          </div>
        </Card>

        {/* Leaderboard Table */}
        <Card className="p-5">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="h-4 w-4 text-amber-400" />
              <span>RANKED OPERATOR LEADERBOARD</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboard.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                NO MEMBERS IN LEADERBOARD
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-surface-border text-slate-400 uppercase">
                      <th className="py-3 px-3">Rank</th>
                      <th className="py-3 px-3">Operator</th>
                      <th className="py-3 px-3">Arc Score</th>
                      <th className="py-3 px-3">Streak</th>
                      <th className="py-3 px-3">Execution Rate</th>
                      <th className="py-3 px-3 text-right">Last Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border text-slate-300">
                    {leaderboard.map((member) => (
                      <tr
                        key={member.userId}
                        className={`hover:bg-surface-muted/30 transition-colors ${
                          member.rank === 1 ? 'bg-amber-950/20' : ''
                        }`}
                      >
                        <td className="py-3 px-3 font-bold">
                          {member.rank === 1 ? (
                            <span className="inline-flex items-center space-x-1 text-amber-400">
                              <Trophy className="h-4 w-4" />
                              <span>#1</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">#{member.rank}</span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-100 uppercase">
                          {member.name}
                        </td>
                        <td className="py-3 px-3 font-bold text-amber-400">
                          {member.score} PTS
                        </td>
                        <td className="py-3 px-3 font-bold text-orange-400">
                          {member.streak} DAYS
                        </td>
                        <td className="py-3 px-3 text-emerald-400 font-semibold">
                          {member.executionPercent}%
                        </td>
                        <td className="py-3 px-3 text-right text-slate-500">
                          {member.lastActiveDate || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
