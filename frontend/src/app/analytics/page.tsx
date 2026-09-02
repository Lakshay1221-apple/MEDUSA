'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '@/components/shell/AppShell';
import { analyticsApi, arcsApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/query/keys';
import { GitDotGraph } from '@/components/gitdot/GitDotGraph';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDuration } from '@/lib/utils/formatters';
import { GitDotMode } from '@/lib/types/domain';
import { BarChart3, CheckSquare, XCircle, FastForward, Repeat, Skull, Clock, GitCommit, Shield } from 'lucide-react';

export default function AnalyticsPage() {
  const [gitDotMode, setGitDotMode] = useState<GitDotMode>('EXECUTION');

  const { data: arcs = [] } = useQuery({
    queryKey: queryKeys.arcs.all,
    queryFn: () => arcsApi.list(),
  });
  const activeArc = arcs[0];

  const { data: warReport, isLoading: isReportLoading } = useQuery({
    queryKey: queryKeys.analytics.warReport(activeArc?.id || ''),
    queryFn: () => analyticsApi.getWarReport(activeArc?.id || ''),
    enabled: !!activeArc?.id,
  });

  const { data: activityCells = [], isLoading: isActivityLoading } = useQuery({
    queryKey: queryKeys.analytics.graph(activeArc?.id, gitDotMode),
    queryFn: () => analyticsApi.getActivityGraph(activeArc?.id, gitDotMode),
    enabled: !!activeArc?.id,
  });

  if (!activeArc) {
    return (
      <AppShell>
        <div className="py-16 text-center font-mono text-slate-400">NO ACTIVE ARC REGISTERED</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto font-mono">
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-surface-border">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wider text-slate-100">
              WEEKLY WAR REPORT & TELEMETRY
            </h1>
            <p className="text-xs text-slate-400">
              Aggregated performance metrics across execution, discipline, and code delivery.
            </p>
          </div>
        </div>

        {/* War Report Summary Cards */}
        {isReportLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ) : warReport ? (
          <div className="space-y-6">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="p-4 border-surface-border">
                <div className="text-[11px] font-bold text-slate-400 uppercase">EXECUTION RATE</div>
                <div className="text-3xl font-black text-emerald-400 mt-2">
                  {warReport.execution_percent}%
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Completed vs Planned</div>
              </Card>

              <Card className="p-4 border-surface-border">
                <div className="text-[11px] font-bold text-slate-400 uppercase">DEEP WORK LOGGED</div>
                <div className="text-3xl font-black text-cyan-400 mt-2">
                  {formatDuration(warReport.deep_work_minutes)}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Focused session time</div>
              </Card>

              <Card className="p-4 border-surface-border">
                <div className="text-[11px] font-bold text-slate-400 uppercase">GITHUB PROOFS</div>
                <div className="text-3xl font-black text-purple-400 mt-2">
                  {warReport.github_verifications}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Commit-verified tasks</div>
              </Card>

              <Card className="p-4 border-surface-border">
                <div className="text-[11px] font-bold text-slate-400 uppercase">BEST DOMAIN</div>
                <div className="text-xl font-black text-blue-400 mt-2 truncate">
                  {warReport.best_category}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Weakest: {warReport.weakest_category}</div>
              </Card>
            </div>

            {/* Task Breakdown Stats */}
            <Card className="p-5">
              <CardHeader>
                <CardTitle>TASK COMMITMENT RESOLUTION BREAKDOWN</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                  <div className="p-3 rounded bg-emerald-950/40 border border-emerald-800 text-emerald-300">
                    <CheckSquare className="h-5 w-5 mx-auto mb-1 text-emerald-400" />
                    <div className="text-xl font-bold">{warReport.tasks_completed}</div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">COMPLETED</div>
                  </div>

                  <div className="p-3 rounded bg-red-950/40 border border-red-800 text-red-300">
                    <XCircle className="h-5 w-5 mx-auto mb-1 text-red-400" />
                    <div className="text-xl font-bold">{warReport.tasks_missed}</div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">MISSED</div>
                  </div>

                  <div className="p-3 rounded bg-amber-950/40 border border-amber-800 text-amber-300">
                    <FastForward className="h-5 w-5 mx-auto mb-1 text-amber-400" />
                    <div className="text-xl font-bold">{warReport.tasks_skipped}</div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">SKIPPED</div>
                  </div>

                  <div className="p-3 rounded bg-blue-950/40 border border-blue-800 text-blue-300">
                    <Repeat className="h-5 w-5 mx-auto mb-1 text-blue-400" />
                    <div className="text-xl font-bold">{warReport.tasks_rescheduled}</div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">RESCHEDULED</div>
                  </div>

                  <div className="p-3 rounded bg-red-950/80 border border-red-700 text-red-200">
                    <Skull className="h-5 w-5 mx-auto mb-1 text-red-400" />
                    <div className="text-xl font-bold">{warReport.tasks_abandoned}</div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">ABANDONED</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* GitDot Activity Graph Matrix */}
        <GitDotGraph
          cells={activityCells}
          currentMode={gitDotMode}
          onModeChange={(m) => setGitDotMode(m)}
          isLoading={isActivityLoading}
        />
      </div>
    </AppShell>
  );
}
