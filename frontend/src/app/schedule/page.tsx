'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/shell/AppShell';
import { schedulingApi, arcsApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/query/keys';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { Calendar, Check, Play, Clock, AlertCircle } from 'lucide-react';

export default function SchedulePage() {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToast();

  const { data: arcs = [] } = useQuery({
    queryKey: queryKeys.arcs.all,
    queryFn: () => arcsApi.list(),
  });
  const activeArc = arcs[0];

  const { data: latestPlan, isLoading } = useQuery({
    queryKey: queryKeys.scheduling.latest(activeArc?.id || ''),
    queryFn: () => schedulingApi.getLatest(activeArc?.id || ''),
    enabled: !!activeArc?.id,
  });

  const generatePlanMutation = useMutation({
    mutationFn: () =>
      schedulingApi.generate({
        arc_id: activeArc?.id || '',
      }),
    onSuccess: () => {
      toastSuccess('PLAN GENERATED', 'AutoScheduler computed optimal topological placement.');
      queryClient.invalidateQueries({ queryKey: queryKeys.scheduling.latest(activeArc?.id || '') });
    },
    onError: (err: any) => toastError('GENERATION FAILED', err.message),
  });

  const acceptPlanMutation = useMutation({
    mutationFn: (planId: string) => schedulingApi.accept(planId),
    onSuccess: () => {
      toastSuccess('SCHEDULE ACCEPTED', 'Task commitments committed to active execution.');
      queryClient.invalidateQueries({ queryKey: queryKeys.scheduling.latest(activeArc?.id || '') });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['arcs'] });
    },
    onError: (err: any) => toastError('ACCEPTANCE FAILED', err.message),
  });

  if (!activeArc) {
    return (
      <AppShell>
        <div className="py-16 text-center font-mono text-slate-400">NO ACTIVE ARC REGISTERED</div>
      </AppShell>
    );
  }

  // Group items by date
  const itemsByDate: Record<string, any[]> = {};
  if (latestPlan?.items) {
    for (const item of latestPlan.items) {
      if (!itemsByDate[item.date]) itemsByDate[item.date] = [];
      itemsByDate[item.date].push(item);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto font-mono">
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-surface-border">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wider text-slate-100">
              AUTOSCHEDULER ENGINE
            </h1>
            <p className="text-xs text-slate-400">
              Topological dependency resolution, capacity balancing, and deadline enforcement.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => generatePlanMutation.mutate()}
              isLoading={generatePlanMutation.isPending}
            >
              <Play className="h-4 w-4 mr-1.5" />
              GENERATE SCHEDULE PLAN
            </Button>
            {latestPlan && latestPlan.status === 'DRAFT' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => acceptPlanMutation.mutate(latestPlan.id)}
                isLoading={acceptPlanMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-500"
              >
                <Check className="h-4 w-4 mr-1.5" />
                ACCEPT & COMMIT PLAN
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : !latestPlan ? (
          <div className="py-16 text-center space-y-3 bg-surface rounded-lg border border-dashed border-surface-border">
            <Calendar className="h-10 w-10 text-slate-600 mx-auto" />
            <div className="text-sm font-bold uppercase text-slate-300">NO SCHEDULE PLAN GENERATED</div>
            <p className="text-xs text-slate-500">
              Click &quot;GENERATE SCHEDULE PLAN&quot; to compute capacity allocation for backlog tasks.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Plan Meta */}
            <Card className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center space-x-3">
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                      latestPlan.status === 'ACCEPTED'
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        : 'bg-amber-950 text-amber-400 border-amber-800 animate-pulse'
                    }`}
                  >
                    STATUS: {latestPlan.status}
                  </span>
                  <span className="text-xs text-slate-400">
                    ENGINE ALGORITHM v{latestPlan.algorithm_version}
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  TOTAL PLANNED PLACEMENTS: {latestPlan.items.length}
                </span>
              </div>
            </Card>

            {/* Daily Placements Timeline */}
            <div className="space-y-4">
              {Object.keys(itemsByDate).sort().map((date) => {
                const dayItems = itemsByDate[date];
                return (
                  <Card key={date} className="p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-surface-border">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-blue-400" />
                        <span className="font-bold text-slate-200 text-sm">{date}</span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {dayItems.length} task(s) allocated
                      </span>
                    </div>

                    <div className="divide-y divide-surface-border/50 text-xs">
                      {dayItems.map((item) => (
                        <div
                          key={item.id}
                          className="py-2.5 flex items-center justify-between flex-wrap gap-2"
                        >
                          <div className="space-y-0.5">
                            <div className="text-slate-100 font-semibold">
                              {item.task?.title || `Task ID: ${item.task_id}`}
                            </div>
                            {item.reason && (
                              <div className="text-[11px] text-slate-400 italic">
                                Placement: {item.reason}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center space-x-4 text-slate-400 text-xs">
                            {item.start_time && (
                              <span>
                                {item.start_time} - {item.end_time}
                              </span>
                            )}
                            {item.task?.estimated_minutes && (
                              <span>{item.task.estimated_minutes}m</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
