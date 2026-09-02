'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/shell/AppShell';
import { focusApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/query/keys';
import { FocusTimerWidget } from '@/components/focus/FocusTimerWidget';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { formatDuration, formatSeconds, formatDate } from '@/lib/utils/formatters';
import { Clock, Zap, CheckCircle2 } from 'lucide-react';

export default function FocusPage() {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError, score: toastScore } = useToast();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: queryKeys.focus.all,
    queryFn: () => focusApi.list(),
  });

  const activeSession = sessions.find((s) => s.status === 'ACTIVE') || null;
  const completedSessions = sessions.filter((s) => s.status === 'COMPLETED');
  const totalFocusMinutes = completedSessions.reduce(
    (sum, s) => sum + Math.round(s.duration_seconds / 60),
    0,
  );

  const startMutation = useMutation({
    mutationFn: (taskId?: string) => focusApi.start({ task_id: taskId }),
    onSuccess: () => {
      toastSuccess('FOCUS SESSION INITIALIZED', 'Deep work chamber active.');
      queryClient.invalidateQueries({ queryKey: queryKeys.focus.all });
    },
    onError: (err: any) => toastError('FOCUS FAILED', err.message),
  });

  const completeMutation = useMutation({
    mutationFn: ({ sessionId, durationSeconds }: { sessionId: string; durationSeconds: number }) =>
      focusApi.complete(sessionId, { duration_seconds: durationSeconds }),
    onSuccess: (res) => {
      toastScore(`+${res.points} DEEP WORK POINTS`, `Focus session complete.`);
      queryClient.invalidateQueries({ queryKey: queryKeys.focus.all });
      queryClient.invalidateQueries({ queryKey: ['arcs'] });
    },
    onError: (err: any) => toastError('FAILED TO COMPLETE FOCUS', err.message),
  });

  const cancelMutation = useMutation({
    mutationFn: (sessionId: string) => focusApi.cancel(sessionId),
    onSuccess: () => {
      toastSuccess('SESSION CANCELLED', 'Focus session discarded.');
      queryClient.invalidateQueries({ queryKey: queryKeys.focus.all });
    },
    onError: (err: any) => toastError('FAILED TO CANCEL FOCUS', err.message),
  });

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto font-mono">
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-surface-border">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wider text-slate-100">
              DEEP WORK FOCUS SESSIONS
            </h1>
            <p className="text-xs text-slate-400">
              High-intensity deep work accumulation. Focus points calculated at daily closure (1 pt per 15 min).
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs text-cyan-400 font-bold bg-cyan-950/70 border border-cyan-800/60 px-3 py-1.5 rounded">
            <Clock className="h-4 w-4" />
            <span>TOTAL DEEP WORK: {formatDuration(totalFocusMinutes)}</span>
          </div>
        </div>

        {/* Live Active Focus Chamber */}
        <FocusTimerWidget
          activeSession={activeSession}
          onStart={async (taskId) => {
            await startMutation.mutateAsync(taskId);
          }}
          onComplete={async (sessionId, durationSeconds) => {
            await completeMutation.mutateAsync({ sessionId, durationSeconds });
          }}
          onCancel={async (sessionId) => {
            await cancelMutation.mutateAsync(sessionId);
          }}
        />

        {/* Focus Sessions History Table */}
        <Card className="p-5">
          <CardHeader>
            <CardTitle>FOCUS SESSION LOGS ({completedSessions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                NO FOCUS SESSIONS RECORDED YET
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-surface-border text-slate-400 uppercase">
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Linked Task</th>
                      <th className="py-2.5 px-3">Started At</th>
                      <th className="py-2.5 px-3">Ended At</th>
                      <th className="py-2.5 px-3 text-right">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border text-slate-300">
                    {sessions.map((sess) => (
                      <tr key={sess.id} className="hover:bg-surface-muted/30 transition-colors">
                        <td className="py-2.5 px-3">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                              sess.status === 'COMPLETED'
                                ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                                : sess.status === 'ACTIVE'
                                ? 'bg-cyan-950 text-cyan-400 border-cyan-800 animate-pulse'
                                : 'bg-red-950 text-red-400 border-red-800'
                            }`}
                          >
                            {sess.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-100">
                          {sess.task?.title || 'General Execution'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">
                          {formatDate(sess.started_at, 'MMM dd, yyyy HH:mm')}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">
                          {sess.ended_at ? formatDate(sess.ended_at, 'HH:mm') : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-cyan-400">
                          {formatSeconds(sess.duration_seconds)}
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
