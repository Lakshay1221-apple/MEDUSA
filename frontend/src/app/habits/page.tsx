'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/shell/AppShell';
import { habitsApi, arcsApi, categoriesApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/query/keys';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { HabitFrequency } from '@/lib/types/domain';
import { Plus, Repeat, Play, Clock, Check } from 'lucide-react';

export default function HabitsPage() {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [frequency, setFrequency] = useState<HabitFrequency>('DAILY');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);

  const { data: arcs = [] } = useQuery({
    queryKey: queryKeys.arcs.all,
    queryFn: () => arcsApi.list(),
  });
  const activeArc = arcs[0];

  const { data: categories = [] } = useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () => categoriesApi.list(),
  });

  const { data: habits = [], isLoading } = useQuery({
    queryKey: queryKeys.habits.byArc(activeArc?.id || ''),
    queryFn: () => habitsApi.list(activeArc?.id || ''),
    enabled: !!activeArc?.id,
  });

  const createHabitMutation = useMutation({
    mutationFn: (dto: any) => habitsApi.create(dto),
    onSuccess: () => {
      toastSuccess('HABIT CREATED', 'Recurring habit template registered.');
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.byArc(activeArc?.id || '') });
      setIsCreateOpen(false);
      setTitle('');
      setDescription('');
    },
    onError: (err: any) => toastError('CREATION FAILED', err.message),
  });

  const generateDailyMutation = useMutation({
    mutationFn: () => {
      const today = new Date().toISOString().split('T')[0];
      return habitsApi.generateDaily(activeArc?.id || '', today);
    },
    onSuccess: (generated) => {
      toastSuccess('HABIT OCCURRENCES GENERATED', `Generated ${generated.length} daily habit tasks.`);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (err: any) => toastError('GENERATION FAILED', err.message),
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createHabitMutation.mutateAsync({
      arc_id: activeArc?.id || '',
      title,
      description: description || undefined,
      category_id: categoryId || categories[0]?.id,
      frequency,
      estimated_minutes: estimatedMinutes,
    });
  };

  const frequencyOptions = [
    { value: 'DAILY', label: 'DAILY' },
    { value: 'WEEKDAYS', label: 'WEEKDAYS (MON-FRI)' },
    { value: 'WEEKENDS', label: 'WEEKENDS (SAT-SUN)' },
    { value: 'CUSTOM', label: 'CUSTOM' },
  ];

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
              RECURRING HABIT TEMPLATES
            </h1>
            <p className="text-xs text-slate-400">
              Deterministic daily routines. Generates actionable task commitments every morning.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateDailyMutation.mutate()}
              isLoading={generateDailyMutation.isPending}
            >
              <Play className="h-4 w-4 mr-1.5" />
              GENERATE TODAY&apos;S HABIT TASKS
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              NEW HABIT TEMPLATE
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Skeleton className="h-36" />
            <Skeleton className="h-36" />
          </div>
        ) : habits.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-surface rounded-lg border border-dashed border-surface-border">
            <Repeat className="h-10 w-10 text-slate-600 mx-auto" />
            <div className="text-sm font-bold uppercase text-slate-300">NO HABITS CONFIGURED</div>
            <p className="text-xs text-slate-500">
              Define recurring training, mindset, or review habits to auto-generate commitments.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {habits.map((habit) => (
              <Card key={habit.id} className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">
                    {habit.frequency}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center space-x-1">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    <span>{habit.estimated_minutes} min</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-100 uppercase">{habit.title}</h3>
                  {habit.description && (
                    <p className="text-xs text-slate-400 mt-1">{habit.description}</p>
                  )}
                </div>

                {habit.category && (
                  <div className="pt-2 border-t border-surface-border flex items-center justify-between text-xs text-slate-400">
                    <span>CATEGORY</span>
                    <span className="text-blue-400 font-bold uppercase">{habit.category.name}</span>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Create Habit Modal */}
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="CREATE HABIT TEMPLATE"
          description="Sets up automated daily commitment generation."
        >
          <form onSubmit={handleCreate} className="space-y-4 font-mono">
            <Input
              label="Habit Title"
              placeholder="e.g. 1hr C++ Memory Layout Drill"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Input
              label="Description (Optional)"
              placeholder="Drill specifications, focus notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Category"
                value={categoryId || categories[0]?.id}
                onChange={(e) => setCategoryId(e.target.value)}
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
              />
              <Select
                label="Frequency"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as HabitFrequency)}
                options={frequencyOptions}
              />
            </div>
            <Input
              label="Estimated Minutes"
              type="number"
              min={5}
              max={720}
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(parseInt(e.target.value, 10))}
              required
            />

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-surface-border">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
                CANCEL
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={createHabitMutation.isPending}>
                REGISTER HABIT
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
