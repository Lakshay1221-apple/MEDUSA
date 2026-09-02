'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/shell/AppShell';
import { arcsApi, arcDaysApi, tasksApi, focusApi, categoriesApi, analyticsApi, accountabilityApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/query/keys';
import { useToast } from '@/components/ui/Toast';
import { TaskCard } from '@/components/tasks/TaskCard';
import { CompleteTaskModal } from '@/components/tasks/CompleteTaskModal';
import { SkipTaskModal } from '@/components/tasks/SkipTaskModal';
import { AbandonTaskModal } from '@/components/tasks/AbandonTaskModal';
import { RescheduleTaskModal } from '@/components/tasks/RescheduleTaskModal';
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';
import { CloseDayModal } from '@/components/arcs/CloseDayModal';
import { FocusTimerWidget } from '@/components/focus/FocusTimerWidget';
import { GitDotGraph } from '@/components/gitdot/GitDotGraph';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Task, GitDotMode } from '@/lib/types/domain';
import { Plus, CheckSquare, Target, Flame, Zap, ShieldAlert, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError, score: toastScore } = useToast();

  const todayStr = new Date().toISOString().split('T')[0];
  const [gitDotMode, setGitDotMode] = useState<GitDotMode>('EXECUTION');

  // Modals state
  const [selectedTaskForComplete, setSelectedTaskForComplete] = useState<Task | null>(null);
  const [selectedTaskForSkip, setSelectedTaskForSkip] = useState<Task | null>(null);
  const [selectedTaskForAbandon, setSelectedTaskForAbandon] = useState<Task | null>(null);
  const [selectedTaskForReschedule, setSelectedTaskForReschedule] = useState<Task | null>(null);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isCloseDayOpen, setIsCloseDayOpen] = useState(false);

  // 1. Fetch Arcs
  const { data: arcs = [], isLoading: isArcsLoading } = useQuery({
    queryKey: queryKeys.arcs.all,
    queryFn: () => arcsApi.list(),
  });

  const activeArc = arcs.find((a) => a.status === 'ACTIVE') || arcs[0];

  // 2. Fetch Categories
  const { data: categories = [] } = useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () => categoriesApi.list(),
  });

  // 3. Fetch Today's Tasks
  const { data: todayTasks = [], isLoading: isTasksLoading } = useQuery({
    queryKey: queryKeys.tasks.all({ arcId: activeArc?.id, date: todayStr }),
    queryFn: () => tasksApi.list({ arcId: activeArc?.id, date: todayStr }),
    enabled: !!activeArc?.id,
  });

  // 4. Fetch Arc Day Detail
  const { data: todayArcDay } = useQuery({
    queryKey: queryKeys.arcs.day(activeArc?.id || '', todayStr),
    queryFn: () => arcDaysApi.getDay(activeArc?.id || '', todayStr),
    enabled: !!activeArc?.id,
  });

  // 5. Fetch Active Focus Sessions
  const { data: focusSessions = [] } = useQuery({
    queryKey: queryKeys.focus.all,
    queryFn: () => focusApi.list(),
  });
  const activeFocusSession = focusSessions.find((s) => s.status === 'ACTIVE') || null;

  // 6. Fetch GitDot graph
  const { data: activityCells = [], isLoading: isActivityLoading } = useQuery({
    queryKey: queryKeys.analytics.graph(activeArc?.id, gitDotMode),
    queryFn: () => analyticsApi.getActivityGraph(activeArc?.id, gitDotMode),
    enabled: !!activeArc?.id,
  });

  // 7. Fetch Accountability Tags
  const { data: tags = [] } = useQuery({
    queryKey: queryKeys.accountability.tags,
    queryFn: () => accountabilityApi.listTags(),
  });

  // Task Mutations
  const completeMutation = useMutation({
    mutationFn: ({ taskId, actualMinutes, notes }: { taskId: string; actualMinutes?: number; notes?: string }) =>
      tasksApi.complete(taskId, { actual_minutes: actualMinutes, notes }),
    onSuccess: (res) => {
      toastScore(`+${res.scoreDelta} POINTS`, `Task executed: ${res.task.title}`);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['arcs'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: (err: any) => toastError('COMPLETION FAILED', err.message),
  });

  const skipMutation = useMutation({
    mutationFn: ({ taskId, reasonCode, commitmentPhrase, reasonText }: any) =>
      tasksApi.skip(taskId, { reason_code: reasonCode, commitment_phrase: commitmentPhrase, reason_text: reasonText }),
    onSuccess: (res) => {
      toastScore(`${res.penalty} POINTS (PENALTY)`, `Task conceded. Streak reset to 0.`);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['arcs'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: (err: any) => toastError('CONCESSION REJECTED', err.message),
  });

  const abandonMutation = useMutation({
    mutationFn: ({ taskId, reason, commitmentPhrase, notes }: any) =>
      tasksApi.abandon(taskId, { reason, commitment_phrase: commitmentPhrase, notes }),
    onSuccess: (res) => {
      toastScore(`${res.penalty} POINTS (TERMINAL PENALTY)`, `Task permanently abandoned.`);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['arcs'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: (err: any) => toastError('ABANDONMENT REJECTED', err.message),
  });

  const rescheduleMutation = useMutation({
    mutationFn: ({ taskId, scheduledDate, scheduledStart, scheduledEnd, reason }: any) =>
      tasksApi.reschedule(taskId, {
        scheduled_date: scheduledDate,
        scheduled_start: scheduledStart,
        scheduled_end: scheduledEnd,
        reason,
      }),
    onSuccess: (res) => {
      toastSuccess('TASK RESCHEDULED', `Moved to ${res.rescheduledTask.scheduled_date}`);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['arcs'] });
    },
    onError: (err: any) => toastError('RESCHEDULE FAILED', err.message),
  });

  const createTaskMutation = useMutation({
    mutationFn: (dto: any) => tasksApi.create(dto),
    onSuccess: () => {
      toastSuccess('TASK COMMITTED', 'Task added to execution graph.');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['arcs'] });
    },
    onError: (err: any) => toastError('CREATION FAILED', err.message),
  });

  const closeDayMutation = useMutation({
    mutationFn: ({ arcId, date }: { arcId: string; date: string }) =>
      arcDaysApi.closeDay(arcId, date),
    onSuccess: () => {
      toastSuccess('DAY CLOSED', 'Authoritative day closure executed.');
      queryClient.invalidateQueries({ queryKey: ['arcs'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: (err: any) => toastError('CLOSURE REJECTED', err.message),
  });

  const startFocusMutation = useMutation({
    mutationFn: (taskId?: string) => focusApi.start({ task_id: taskId }),
    onSuccess: () => {
      toastSuccess('FOCUS SESSION INITIALIZED', 'Deep work chamber active.');
      queryClient.invalidateQueries({ queryKey: queryKeys.focus.all });
    },
    onError: (err: any) => toastError('FOCUS FAILED', err.message),
  });

  const completeFocusMutation = useMutation({
    mutationFn: ({ sessionId, durationSeconds }: { sessionId: string; durationSeconds: number }) =>
      focusApi.complete(sessionId, { duration_seconds: durationSeconds }),
    onSuccess: (res) => {
      toastScore(`+${res.points} DEEP WORK POINTS`, `Focus session complete.`);
      queryClient.invalidateQueries({ queryKey: queryKeys.focus.all });
      queryClient.invalidateQueries({ queryKey: ['arcs'] });
    },
    onError: (err: any) => toastError('FAILED TO COMPLETE FOCUS', err.message),
  });

  const cancelFocusMutation = useMutation({
    mutationFn: (sessionId: string) => focusApi.cancel(sessionId),
    onSuccess: () => {
      toastSuccess('SESSION CANCELLED', 'Focus session discarded.');
      queryClient.invalidateQueries({ queryKey: queryKeys.focus.all });
    },
    onError: (err: any) => toastError('FAILED TO CANCEL FOCUS', err.message),
  });

  if (isArcsLoading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <Skeleton className="h-16 w-full" />
          <div className="grid grid-cols-4 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </AppShell>
    );
  }

  if (!activeArc) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center font-mono space-y-4">
          <div className="h-16 w-16 rounded bg-blue-600/20 border border-blue-500/50 flex items-center justify-center text-blue-400 font-bold text-2xl">
            <Target className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold uppercase tracking-widest text-slate-100">
            NO ACTIVE EXECUTION ARC
          </h2>
          <p className="text-xs text-slate-400 max-w-md">
            MEDUSA requires an active Execution Arc to enforce commitments, schedule workloads, and track score vectors.
          </p>
          <Link href="/arcs">
            <Button variant="primary" size="lg">
              INITIALIZE FIRST ARC
            </Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  // Compute metrics from backend data
  const userStats = activeArc.user_stats;
  const currentScore = userStats?.current_score || 0;
  const currentStreak = userStats?.current_streak || 0;
  const longestStreak = userStats?.longest_streak || 0;
  const pendingCount = todayTasks.filter((t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length;
  const completedTodayCount = todayTasks.filter((t) => t.status === 'COMPLETED').length;
  const totalTodayCount = todayTasks.length;
  const executionPercent =
    totalTodayCount > 0 ? Math.round((completedTodayCount / totalTodayCount) * 100) : 0;

  const isDayOpen = todayArcDay ? todayArcDay.status === 'OPEN' : true;

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto font-mono">
        {/* Arc Operational Banner */}
        <div className="rounded-lg bg-surface border border-surface-border p-6 shadow-tactical flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 bg-blue-950/70 border border-blue-800/60 px-2 py-0.5 rounded">
                ACTIVE ARC
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {activeArc.start_date.split('T')[0]} &rarr; {activeArc.end_date.split('T')[0]}
              </span>
            </div>
            <h1 className="text-2xl font-black uppercase tracking-wider text-slate-100">
              {activeArc.name}
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreateTaskOpen(true)}
              className="text-xs"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              NEW TASK
            </Button>
            {isDayOpen && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCloseDayOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-xs"
              >
                <CheckSquare className="h-4 w-4 mr-1.5" />
                CLOSE TODAY'S EXECUTION
              </Button>
            )}
          </div>
        </div>

        {/* Behavioral Tags Banner */}
        {tags.length > 0 && (
          <div className="flex items-center space-x-2 p-3 bg-surface-muted/60 rounded border border-surface-border overflow-x-auto">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
              BEHAVIORAL TAGS:
            </span>
            <div className="flex items-center space-x-1.5">
              {tags.map((tag) => (
                <span
                  key={tag.id}
                  className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-surface-subtle border border-surface-border text-slate-300 shrink-0"
                >
                  {tag.tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Top 4 Mission Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 border-surface-border">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>ARC SCORE</span>
              <Zap className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-slate-100 mt-2">
              {currentScore} <span className="text-xs font-normal text-slate-500">PTS</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Authoritative ledger balance</div>
          </Card>

          <Card className="p-4 border-surface-border">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>CURRENT STREAK</span>
              <Flame className="h-4 w-4 text-orange-400" />
            </div>
            <div className="text-2xl font-black text-slate-100 mt-2">
              {currentStreak} <span className="text-xs font-normal text-slate-500">DAYS</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Record: {longestStreak} days</div>
          </Card>

          <Card className="p-4 border-surface-border">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>TODAY'S EXECUTION</span>
              <CheckSquare className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-slate-100 mt-2">
              {executionPercent}%
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {completedTodayCount} of {totalTodayCount} commitments resolved
            </div>
          </Card>

          <Card className="p-4 border-surface-border">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>UNRESOLVED</span>
              <ShieldAlert className="h-4 w-4 text-red-400" />
            </div>
            <div className="text-2xl font-black text-slate-100 mt-2">
              {pendingCount}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Action required before daily closure</div>
          </Card>
        </div>

        {/* Live Focus Chamber Widget */}
        <FocusTimerWidget
          activeSession={activeFocusSession}
          onStart={(taskId) => startFocusMutation.mutateAsync(taskId)}
          onComplete={(sessionId, durationSeconds) =>
            completeFocusMutation.mutateAsync({ sessionId, durationSeconds })
          }
          onCancel={(sessionId) => cancelFocusMutation.mutateAsync(sessionId)}
        />

        {/* Today's Tasks Operational Feed */}
        <Card className="p-5">
          <CardHeader className="flex items-center justify-between pb-3 mb-4">
            <div>
              <CardTitle>TODAY'S DIRECTIVES & COMMITMENTS ({todayStr})</CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Execute without compromise. Every concession incurs authoritative penalty.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreateTaskOpen(true)}
              className="text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              ADD DIRECTIVE
            </Button>
          </CardHeader>

          <CardContent>
            {isTasksLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : todayTasks.length === 0 ? (
              <div className="py-12 text-center space-y-2 border border-dashed border-surface-border rounded-lg bg-surface-muted/20">
                <CheckSquare className="h-8 w-8 text-slate-600 mx-auto" />
                <div className="text-xs font-bold uppercase text-slate-400">
                  NO COMMITMENTS REMAINING FOR TODAY
                </div>
                <p className="text-[11px] text-slate-500">
                  Schedule backlog items or trigger daily habit occurrences.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {todayTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onComplete={(t) => setSelectedTaskForComplete(t)}
                    onSkip={(t) => setSelectedTaskForSkip(t)}
                    onAbandon={(t) => setSelectedTaskForAbandon(t)}
                    onReschedule={(t) => setSelectedTaskForReschedule(t)}
                    onStartFocus={(t) => startFocusMutation.mutateAsync(t.id)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* GitDot Activity Heatmap Matrix */}
        <GitDotGraph
          cells={activityCells}
          currentMode={gitDotMode}
          onModeChange={(m) => setGitDotMode(m)}
          isLoading={isActivityLoading}
        />
      </div>

      {/* Task Action Modals */}
      <CompleteTaskModal
        task={selectedTaskForComplete}
        isOpen={!!selectedTaskForComplete}
        onClose={() => setSelectedTaskForComplete(null)}
        onComplete={async (taskId, actualMinutes, notes) => {
          await completeMutation.mutateAsync({ taskId, actualMinutes, notes });
        }}
      />

      <SkipTaskModal
        task={selectedTaskForSkip}
        isOpen={!!selectedTaskForSkip}
        onClose={() => setSelectedTaskForSkip(null)}
        onSkip={async (taskId, reasonCode, commitmentPhrase, reasonText) => {
          await skipMutation.mutateAsync({ taskId, reasonCode, commitmentPhrase, reasonText });
        }}
      />

      <AbandonTaskModal
        task={selectedTaskForAbandon}
        isOpen={!!selectedTaskForAbandon}
        onClose={() => setSelectedTaskForAbandon(null)}
        onAbandon={async (taskId, reason, commitmentPhrase, notes) => {
          await abandonMutation.mutateAsync({ taskId, reason, commitmentPhrase, notes });
        }}
      />

      <RescheduleTaskModal
        task={selectedTaskForReschedule}
        isOpen={!!selectedTaskForReschedule}
        onClose={() => setSelectedTaskForReschedule(null)}
        onReschedule={async (taskId, scheduledDate, scheduledStart, scheduledEnd, reason) => {
          await rescheduleMutation.mutateAsync({
            taskId,
            scheduledDate,
            scheduledStart,
            scheduledEnd,
            reason,
          });
        }}
      />

      <CreateTaskModal
        arcId={activeArc.id}
        categories={categories}
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        onCreate={async (dto) => {
          await createTaskMutation.mutateAsync(dto);
        }}
      />

      <CloseDayModal
        arcDay={todayArcDay || null}
        pendingTasks={todayTasks.filter((t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS')}
        isOpen={isCloseDayOpen}
        onClose={() => setIsCloseDayOpen(false)}
        onCloseDay={async (arcId, date) => {
          await closeDayMutation.mutateAsync({ arcId, date });
        }}
      />
    </AppShell>
  );
}
