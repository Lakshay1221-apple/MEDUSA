'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '@/components/shell/AppShell';
import { tasksApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/query/keys';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDuration, formatDate } from '@/lib/utils/formatters';
import { ArrowLeft, GitCommit, Bot, User, Clock, Shield, History, Activity } from 'lucide-react';

export default function TaskDetailPage() {
  const params = useParams();
  const taskId = params.id as string;

  const { data: task, isLoading } = useQuery({
    queryKey: queryKeys.tasks.detail(taskId),
    queryFn: () => tasksApi.getById(taskId),
    enabled: !!taskId,
  });

  const { data: revisions = [] } = useQuery({
    queryKey: queryKeys.tasks.revisions(taskId),
    queryFn: () => tasksApi.getRevisions(taskId),
    enabled: !!taskId,
  });

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </AppShell>
    );
  }

  if (!task) {
    return (
      <AppShell>
        <div className="py-16 text-center font-mono text-slate-400">TASK DIRECTIVE NOT FOUND</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto font-mono">
        <Link
          href="/tasks"
          className="inline-flex items-center space-x-2 text-xs text-slate-400 hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>BACK TO TASK REGISTRY</span>
        </Link>

        {/* Task Overview Card */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <Badge status={task.status} />
                <Badge priority={task.priority} />
                {task.category && (
                  <span className="text-xs uppercase font-bold text-blue-400 bg-blue-950/60 border border-blue-800/60 px-2 py-0.5 rounded">
                    {task.category.name}
                  </span>
                )}
                {task.origin === 'AI' ? (
                  <span className="inline-flex items-center space-x-1 text-xs text-purple-400 bg-purple-950/50 border border-purple-800/50 px-2 py-0.5 rounded">
                    <Bot className="h-3.5 w-3.5" />
                    <span>ORIGIN: AI EXTRACTION</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 text-xs text-slate-400 bg-surface-subtle border border-surface-border px-2 py-0.5 rounded">
                    <User className="h-3.5 w-3.5" />
                    <span>ORIGIN: OPERATOR</span>
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-4 text-xs text-slate-400">
                <span>EST: {formatDuration(task.estimated_minutes)}</span>
                {task.actual_minutes !== null && (
                  <span className="text-emerald-400">ACTUAL: {formatDuration(task.actual_minutes)}</span>
                )}
                <span className="text-amber-400 font-bold">DIFFICULTY: D{task.difficulty}</span>
              </div>
            </div>

            <div>
              <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-100">
                {task.title}
              </h1>
              {task.description && (
                <p className="mt-2 text-xs text-slate-300 font-normal leading-relaxed bg-surface-muted p-3 rounded border border-surface-border">
                  {task.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-surface-border text-xs text-slate-400">
              <div>
                <span className="text-slate-500 block">SCHEDULED DATE</span>
                <span className="font-bold text-slate-200">{task.scheduled_date || 'UNSCHEDULED'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">VERIFICATION MODE</span>
                <span className="font-bold text-slate-200">{task.verification_type}</span>
              </div>
              <div>
                <span className="text-slate-500 block">VERIFICATION STATUS</span>
                <span className="font-bold text-slate-200">{task.verification_status}</span>
              </div>
              <div>
                <span className="text-slate-500 block">USER MODIFIED</span>
                <span className="font-bold text-slate-200">{task.user_modified ? 'YES (V2+)' : 'NO (V1)'}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Task Revision History (Diff / Audit) */}
        <Card className="p-5">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <History className="h-4 w-4 text-blue-400" />
              <span>REVISION HISTORY & AUDIT TRAIL</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {revisions.length === 0 ? (
              <div className="text-xs text-slate-500">NO REVISION HISTORY RECORDED</div>
            ) : (
              <div className="space-y-3">
                {revisions.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-3.5 rounded bg-surface-muted/50 border border-surface-border text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 font-bold">
                        <span className="text-blue-400 uppercase">REVISION v{rev.version}</span>
                        <span className="text-slate-500">BY {rev.changed_by}</span>
                      </div>
                      <span className="text-slate-500 text-[10px]">
                        {formatDate(rev.created_at, 'MMM dd, yyyy HH:mm:ss')}
                      </span>
                    </div>

                    <div className="text-slate-200 font-semibold">{rev.title}</div>
                    {rev.change_summary && (
                      <div className="text-slate-400 text-[11px] italic">
                        Summary: {rev.change_summary}
                      </div>
                    )}
                    <div className="flex items-center space-x-4 text-[11px] text-slate-400 pt-1 border-t border-surface-border/50">
                      <span>Est: {rev.estimated_minutes}m</span>
                      <span>Diff: D{rev.difficulty}</span>
                      <span>Priority: {rev.priority}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Task Events Stream */}
        <Card className="p-5">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-emerald-400" />
              <span>IMMUTABLE TASK EVENTS LEDGER</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(!task.events || task.events.length === 0) ? (
              <div className="text-xs text-slate-500">NO EVENTS RECORDED</div>
            ) : (
              <div className="space-y-2">
                {task.events.map((evt) => (
                  <div
                    key={evt.id}
                    className="flex items-center justify-between p-2.5 rounded bg-surface-subtle border border-surface-border text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-slate-200">{evt.event_type}</span>
                      {evt.from_status && (
                        <span className="text-slate-500">
                          {evt.from_status} &rarr; {evt.to_status}
                        </span>
                      )}
                      {evt.reason_code && (
                        <span className="text-amber-400 text-[11px]">
                          [{evt.reason_code}] {evt.reason_text}
                        </span>
                      )}
                    </div>
                    <span className="text-slate-500 text-[10px]">
                      {formatDate(evt.occurred_at, 'MMM dd, yyyy HH:mm:ss')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
