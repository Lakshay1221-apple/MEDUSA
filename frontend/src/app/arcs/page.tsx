'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/shell/AppShell';
import { arcsApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/query/keys';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { Plus, Target, Calendar, Clock, Flame, Zap } from 'lucide-react';

export default function ArcsPage() {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
  );
  const [dailyCapacity, setDailyCapacity] = useState(360);

  const { data: arcs = [], isLoading } = useQuery({
    queryKey: queryKeys.arcs.all,
    queryFn: () => arcsApi.list(),
  });

  const createArcMutation = useMutation({
    mutationFn: (dto: any) => arcsApi.create(dto),
    onSuccess: (newArc) => {
      toastSuccess('ARC INITIALIZED', `Execution Arc "${newArc.name}" created with daily tracking.`);
      queryClient.invalidateQueries({ queryKey: queryKeys.arcs.all });
      setIsCreateOpen(false);
      setName('');
      setDescription('');
    },
    onError: (err: any) => toastError('INITIALIZATION FAILED', err.message),
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createArcMutation.mutateAsync({
      name,
      description: description || undefined,
      start_date: startDate,
      end_date: endDate,
      daily_capacity_minutes: dailyCapacity,
      weekly_capacity_minutes: dailyCapacity * 6,
    });
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto font-mono">
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-surface-border">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wider text-slate-100">
              EXECUTION ARCS
            </h1>
            <p className="text-xs text-slate-400">
              Long-term execution cycles. Each Arc contains daily workload capacity and score tracking.
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            INITIALIZE NEW ARC
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        ) : arcs.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-surface rounded-lg border border-dashed border-surface-border">
            <Target className="h-10 w-10 text-slate-600 mx-auto" />
            <div className="text-sm font-bold uppercase text-slate-300">NO ARCS REGISTERED</div>
            <p className="text-xs text-slate-500">Initialize an Arc to begin execution enforcement.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {arcs.map((arc) => (
              <Card key={arc.id} className="card-tactical-interactive flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">
                      {arc.status}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center space-x-1">
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                      <span>{arc.daily_capacity_minutes}m/day</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-100 uppercase tracking-tight">
                      {arc.name}
                    </h3>
                    {arc.description && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{arc.description}</p>
                    )}
                  </div>

                  <div className="text-xs text-slate-400 space-y-1 pt-2 border-t border-surface-border">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      <span>{arc.start_date.split('T')[0]} &rarr; {arc.end_date.split('T')[0]}</span>
                    </div>
                  </div>

                  {arc.user_stats && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-surface-border text-xs">
                      <div className="flex items-center space-x-1.5 text-amber-400">
                        <Zap className="h-3.5 w-3.5" />
                        <span>{arc.user_stats.current_score} PTS</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-orange-400">
                        <Flame className="h-3.5 w-3.5" />
                        <span>{arc.user_stats.current_streak}D STREAK</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-surface-border">
                  <Link href={`/arcs/${arc.id}`}>
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      INSPECT ARC TIMELINE &rarr;
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create Arc Modal */}
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="INITIALIZE EXECUTION ARC"
          description="Sets up daily capacity schedules and initializes authoritative user statistics."
        >
          <form onSubmit={handleCreate} className="space-y-4 font-mono">
            <Input
              label="Arc Name"
              placeholder="e.g. Q4 Systems Mastery"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Description (Optional)"
              placeholder="Core focus areas, milestones..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
              <Input
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
            <Input
              label="Daily Capacity (Minutes)"
              type="number"
              min={30}
              max={1440}
              value={dailyCapacity}
              onChange={(e) => setDailyCapacity(parseInt(e.target.value, 10))}
              required
            />

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-surface-border">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
                CANCEL
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={createArcMutation.isPending}>
                INITIALIZE ARC
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
