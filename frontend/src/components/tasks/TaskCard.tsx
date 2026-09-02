'use client';

import React from 'react';
import Link from 'next/link';
import { Task } from '@/lib/types/domain';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDuration } from '@/lib/utils/formatters';
import { Check, FastForward, Calendar, Trash2, Clock, GitCommit, Bot, User as UserIcon } from 'lucide-react';

export interface TaskCardProps {
  task: Task;
  onComplete?: (task: Task) => void;
  onSkip?: (task: Task) => void;
  onAbandon?: (task: Task) => void;
  onReschedule?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onStartFocus?: (task: Task) => void;
}

export function TaskCard({
  task,
  onComplete,
  onSkip,
  onAbandon,
  onReschedule,
  onDelete,
  onStartFocus,
}: TaskCardProps) {
  const isActionable = task.status === 'PENDING' || task.status === 'IN_PROGRESS';
  const isBacklog = task.status === 'BACKLOG';

  return (
    <div className="rounded-lg bg-surface border border-surface-border p-4 hover:border-slate-700 transition-colors space-y-3 font-mono">
      {/* Header Badges */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center space-x-2">
          <Badge status={task.status} />
          <Badge priority={task.priority} />
          {task.category && (
            <span className="text-[10px] uppercase font-bold text-blue-400 bg-blue-950/60 border border-blue-800/60 px-2 py-0.5 rounded">
              {task.category.name}
            </span>
          )}
          {task.origin === 'AI' ? (
            <span className="inline-flex items-center space-x-1 text-[10px] text-purple-400 bg-purple-950/50 border border-purple-800/50 px-1.5 py-0.5 rounded" title="Extracted by AI">
              <Bot className="h-3 w-3" />
              <span>AI</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1 text-[10px] text-slate-400 bg-surface-subtle border border-surface-border px-1.5 py-0.5 rounded" title="Created by Operator">
              <UserIcon className="h-3 w-3" />
              <span>USER</span>
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <span className="flex items-center space-x-1" title="Estimated duration">
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            <span>{formatDuration(task.estimated_minutes)}</span>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-amber-400 font-bold" title="Difficulty Level">
            D{task.difficulty}
          </span>
          {task.verification_type !== 'MANUAL' && (
            <span className="text-emerald-400 flex items-center space-x-1" title="GitHub Verified">
              <GitCommit className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
      </div>

      {/* Task Title & Details */}
      <div>
        <Link
          href={`/tasks/${task.id}`}
          className="text-sm font-bold text-slate-100 hover:text-blue-400 transition-colors line-clamp-2"
        >
          {task.title}
        </Link>
        {task.description && (
          <p className="mt-1 text-xs text-slate-400 line-clamp-2 font-normal leading-relaxed">
            {task.description}
          </p>
        )}
      </div>

      {/* Time & Scheduling Info */}
      {(task.scheduled_date || task.scheduled_start) && (
        <div className="text-[11px] text-slate-500 flex items-center space-x-3">
          {task.scheduled_date && <span>DATE: {task.scheduled_date}</span>}
          {task.scheduled_start && (
            <span>TIME: {task.scheduled_start} {task.scheduled_end ? `- ${task.scheduled_end}` : ''}</span>
          )}
        </div>
      )}

      {/* Action Toolbar */}
      <div className="pt-2 border-t border-surface-border flex items-center justify-between gap-2 flex-wrap">
        <Link
          href={`/tasks/${task.id}`}
          className="text-[11px] text-slate-400 hover:text-slate-200 uppercase tracking-wider"
        >
          INSPECT LOGS &rarr;
        </Link>

        <div className="flex items-center space-x-1.5">
          {isActionable && (
            <>
              {onStartFocus && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onStartFocus(task)}
                  className="px-2 text-[10px] text-blue-400 hover:text-blue-300"
                  title="Launch Focus Session"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  FOCUS
                </Button>
              )}
              {onReschedule && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReschedule(task)}
                  className="px-2 text-[10px]"
                  title="Reschedule"
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  MOVE
                </Button>
              )}
              {onSkip && (
                <Button
                  variant="warning"
                  size="sm"
                  onClick={() => onSkip(task)}
                  className="px-2 text-[10px]"
                  title="Concede / Skip"
                >
                  <FastForward className="h-3 w-3 mr-1" />
                  SKIP
                </Button>
              )}
              {onComplete && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onComplete(task)}
                  className="px-2.5 text-[10px] bg-emerald-600 hover:bg-emerald-500 border-emerald-500"
                  title="Record Completion"
                >
                  <Check className="h-3 w-3 mr-1" />
                  DONE
                </Button>
              )}
            </>
          )}

          {isBacklog && (
            <>
              {onReschedule && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onReschedule(task)}
                  className="px-2.5 text-[10px]"
                >
                  SCHEDULE
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(task)}
                  className="px-2 text-slate-500 hover:text-red-400"
                  title="Delete backlog item"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
