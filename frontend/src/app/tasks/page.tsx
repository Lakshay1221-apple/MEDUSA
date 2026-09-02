'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/shell/AppShell';
import { tasksApi, arcsApi, categoriesApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/query/keys';
import { TaskCard } from '@/components/tasks/TaskCard';
import { CompleteTaskModal } from '@/components/tasks/CompleteTaskModal';
import { SkipTaskModal } from '@/components/tasks/SkipTaskModal';
import { AbandonTaskModal } from '@/components/tasks/AbandonTaskModal';
import { RescheduleTaskModal } from '@/components/tasks/RescheduleTaskModal';
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Tabs } from '@/components/ui/Tabs';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { Task, TaskStatus } from '@/lib/types/domain';
import { Plus, CheckSquare, Search, Filter } from 'lucide-react';

export default function TasksPage() {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError, score: toastScore } = useToast();

  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Modals
  const [selectedTaskForComplete, setSelectedTaskForComplete] = useState<Task | null>(null);
  const [selectedTaskForSkip, setSelectedTaskForSkip] = useState<Task | null>(null);
  const [selectedTaskForAbandon, setSelectedTaskForAbandon] = useState<Task | null>(null);
  const [selectedTaskForReschedule, setSelectedTaskForReschedule] = useState<Task | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Fetch active Arc
  const { data: arcs = [] } = useQuery({
    queryKey: queryKeys.arcs.all,
    queryFn: () => arcsApi.list(),
  });
  const activeArc = arcs[0];

  // Fetch Categories
  const { data: categories = [] } = useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () => categoriesApi.list(),
  });

  // Fetch Tasks
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: queryKeys.tasks.all({
      arcId: activeArc?.id,
      status: activeTab === 'ALL' ? undefined : (activeTab as TaskStatus),
      categoryId: selectedCategoryId || undefined,
      date: dateFilter || undefined,
    }),
    queryFn: () =>
      tasksApi.list({
        arcId: activeArc?.id,
        status: activeTab === 'ALL' ? undefined : (activeTab as TaskStatus),
        categoryId: selectedCategoryId || undefined,
        date: dateFilter || undefined,
      }),
    enabled: !!activeArc?.id,
  });

  // Task Mutations
  const completeMutation = useMutation({
    mutationFn: ({ taskId, actualMinutes, notes }: any) =>
      tasksApi.complete(taskId, { actual_minutes: actualMinutes, notes }),
    onSuccess: (res) => {
      toastScore(`+${res.scoreDelta} POINTS`, `Task executed: ${res.task.title}`);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['arcs'] });
    },
    onError: (err: any) => toastError('COMPLETION FAILED', err.message),
  });

  const skipMutation = useMutation({
    mutationFn: ({ taskId, reasonCode, commitmentPhrase, reasonText }: any) =>
      tasksApi.skip(taskId, { reason_code: reasonCode, commitment_phrase: commitmentPhrase, reason_text: reasonText }),
    onSuccess: (res) => {
      toastScore(`${res.penalty} POINTS (PENALTY)`, `Task conceded. Streak reset.`);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['arcs'] });
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
    },
    onError: (err: any) => toastError('RESCHEDULE FAILED', err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (taskId: string) => tasksApi.delete(taskId),
    onSuccess: () => {
      toastSuccess('TASK REMOVED', 'Backlog task deleted.');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (err: any) => toastError('DELETION REJECTED', err.message),
  });

  const filteredTasks = tasks.filter((t) => {
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const statusTabs = [
    { id: 'ALL', label: 'ALL' },
    { id: 'PENDING', label: 'PENDING' },
    { id: 'IN_PROGRESS', label: 'IN PROGRESS' },
    { id: 'BACKLOG', label: 'BACKLOG' },
    { id: 'COMPLETED', label: 'COMPLETED' },
    { id: 'SKIPPED', label: 'SKIPPED' },
    { id: 'MISSED', label: 'MISSED' },
    { id: 'ABANDONED', label: 'ABANDONED' },
  ];

  const categoryOptions = [
    { value: '', label: 'ALL CATEGORIES' },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto font-mono">
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-surface-border">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wider text-slate-100">
              TASK DIRECTIVE REGISTRY
            </h1>
            <p className="text-xs text-slate-400">
              Complete task lifecycle. Track AI extractions, user modifications, revisions, and execution state.
            </p>
          </div>
          {activeArc && (
            <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              CREATE TASK
            </Button>
          )}
        </div>

        {/* Status Tabs */}
        <Tabs tabs={statusTabs} activeTab={activeTab} onChange={(id) => setActiveTab(id)} />

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-surface rounded-lg border border-surface-border">
          <Input
            placeholder="Search directives by keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            options={categoryOptions}
          />
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            placeholder="Filter by scheduled date..."
          />
        </div>

        {/* Tasks Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-36" />
            <Skeleton className="h-36" />
            <Skeleton className="h-36" />
            <Skeleton className="h-36" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="py-16 text-center space-y-2 bg-surface rounded-lg border border-dashed border-surface-border">
            <CheckSquare className="h-8 w-8 text-slate-600 mx-auto" />
            <div className="text-xs font-bold uppercase text-slate-400">NO DIRECTIVES MATCHING FILTER</div>
            <p className="text-[11px] text-slate-500">Adjust search parameters or create a new task.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={(t) => setSelectedTaskForComplete(t)}
                onSkip={(t) => setSelectedTaskForSkip(t)}
                onAbandon={(t) => setSelectedTaskForAbandon(t)}
                onReschedule={(t) => setSelectedTaskForReschedule(t)}
                onDelete={(t) => deleteMutation.mutate(t.id)}
              />
            ))}
          </div>
        )}

        {/* Modals */}
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

        {activeArc && (
          <CreateTaskModal
            arcId={activeArc.id}
            categories={categories}
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            onCreate={async (dto) => {
              await tasksApi.create(dto);
              queryClient.invalidateQueries({ queryKey: ['tasks'] });
              toastSuccess('TASK COMMITTED', 'Task added to execution graph.');
            }}
          />
        )}
      </div>
    </AppShell>
  );
}
