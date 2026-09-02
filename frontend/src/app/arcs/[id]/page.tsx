'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/shell/AppShell';
import { arcsApi, arcDaysApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/query/keys';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { CloseDayModal } from '@/components/arcs/CloseDayModal';
import { useToast } from '@/components/ui/Toast';
import { formatDuration, formatScoreDelta } from '@/lib/utils/formatters';
import { Calendar, CheckSquare, Clock, Zap, Target } from 'lucide-react';

export default function ArcDetailPage() {
  const params = useParams();
  const arcId = params.id as string;
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToast();

  const [selectedDayForClose, setSelectedDayForClose] = useState<any>(null);

  const { data: arc, isLoading: isArcLoading } = useQuery({
    queryKey: queryKeys.arcs.detail(arcId),
    queryFn: () => arcsApi.getById(arcId),
    enabled: !!arcId,
  });

  const { data: arcDays = [], isLoading: isDaysLoading } = useQuery({
    queryKey: queryKeys.arcs.days(arcId),
    queryFn: () => arcDaysApi.listDays(arcId),
    enabled: !!arcId,
  });

  const closeDayMutation = useMutation({
    mutationFn: ({ arcId, date }: { arcId: string; date: string }) =>
      arcDaysApi.closeDay(arcId, date),
    onSuccess: () => {
      toastSuccess('DAY CLOSED', 'Authoritative day closure executed.');
      queryClient.invalidateQueries({ queryKey: queryKeys.arcs.days(arcId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.arcs.detail(arcId) });
    },
    onError: (err: any) => toastError('CLOSURE REJECTED', err.message),
  });

  if (isArcLoading || isDaysLoading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppShell>
    );
  }

  if (!arc) {
    return (
      <AppShell>
        <div className="py-16 text-center font-mono text-slate-400">ARC NOT FOUND</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto font-mono">
        {/* Arc Overview Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">
                  {arc.status}
                </span>
                <span className="text-xs text-slate-400">
                  {arc.start_date.split('T')[0]} &rarr; {arc.end_date.split('T')[0]}
                </span>
              </div>
              <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-100 mt-1">
                {arc.name}
              </h1>
              {arc.description && (
                <p className="text-xs text-slate-400 mt-1">{arc.description}</p>
              )}
            </div>

            <div className="flex items-center space-x-6 text-xs text-slate-300">
              <div>
                <span className="text-slate-500 block">DAILY CAPACITY</span>
                <span className="font-bold text-slate-200">{arc.daily_capacity_minutes} MIN</span>
              </div>
              <div>
                <span className="text-slate-500 block">SCORE</span>
                <span className="font-bold text-amber-400">{arc.user_stats?.current_score || 0} PTS</span>
              </div>
              <div>
                <span className="text-slate-500 block">STREAK</span>
                <span className="font-bold text-orange-400">{arc.user_stats?.current_streak || 0} DAYS</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Days Timeline Table */}
        <Card className="p-5">
          <CardHeader>
            <CardTitle>ARC DAYS EXECUTION TIMELINE</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-surface-border text-slate-400 uppercase">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Planned</th>
                    <th className="py-2.5 px-3">Completed</th>
                    <th className="py-2.5 px-3">Missed</th>
                    <th className="py-2.5 px-3">Skipped</th>
                    <th className="py-2.5 px-3">Deep Work</th>
                    <th className="py-2.5 px-3">Score Delta</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border text-slate-300">
                  {arcDays.map((day) => (
                    <tr key={day.id} className="hover:bg-surface-muted/30 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-200">{day.date}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                            day.status === 'CLOSED'
                              ? 'bg-surface-subtle text-slate-400 border-surface-border'
                              : 'bg-emerald-950 text-emerald-400 border-emerald-800 animate-pulse'
                          }`}
                        >
                          {day.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">{day.planned_tasks} tasks</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-semibold">
                        {day.completed_tasks}
                      </td>
                      <td className="py-2.5 px-3 text-red-400">{day.missed_tasks}</td>
                      <td className="py-2.5 px-3 text-amber-400">{day.skipped_tasks}</td>
                      <td className="py-2.5 px-3 text-cyan-400">
                        {formatDuration(day.deep_work_minutes)}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-100">
                        {formatScoreDelta(day.score_delta)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {day.status === 'OPEN' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[10px] px-2 py-1"
                            onClick={() => setSelectedDayForClose(day)}
                          >
                            CLOSE DAY
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <CloseDayModal
        arcDay={selectedDayForClose}
        pendingTasks={[]}
        isOpen={!!selectedDayForClose}
        onClose={() => setSelectedDayForClose(null)}
        onCloseDay={async (arcId, date) => {
          await closeDayMutation.mutateAsync({ arcId, date });
        }}
      />
    </AppShell>
  );
}
