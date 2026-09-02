'use client';

import React, { useState, useEffect } from 'react';
import { FocusSession, Task } from '@/lib/types/domain';
import { Button } from '@/components/ui/Button';
import { formatSeconds } from '@/lib/utils/formatters';
import { Play, Square, XCircle } from 'lucide-react';

export interface FocusTimerWidgetProps {
  activeSession: FocusSession | null;
  onStart: (taskId?: string) => Promise<void>;
  onComplete: (sessionId: string, durationSeconds: number) => Promise<void>;
  onCancel: (sessionId: string) => Promise<void>;
  selectedTask?: Task | null;
}

export function FocusTimerWidget({
  activeSession,
  onStart,
  onComplete,
  onCancel,
  selectedTask,
}: FocusTimerWidgetProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (activeSession && activeSession.status === 'ACTIVE') {
      const startTime = new Date(activeSession.started_at).getTime();
      const initialElapsed = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
      setElapsedSeconds(initialElapsed);

      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeSession]);

  const handleStart = async () => {
    try {
      setIsLoading(true);
      await onStart(selectedTask?.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!activeSession) return;
    try {
      setIsLoading(true);
      await onComplete(activeSession.id, Math.max(1, elapsedSeconds));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!activeSession) return;
    try {
      setIsLoading(true);
      await onCancel(activeSession.id);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-lg bg-surface border border-surface-border p-5 font-mono space-y-4 shadow-tactical">
      <div className="flex items-center justify-between pb-3 border-b border-surface-border">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-200">
            DEEP WORK FOCUS CHAMBER
          </h3>
          <p className="text-[11px] text-slate-400">
            Authoritative session logging. Focus points calculated at daily closure.
          </p>
        </div>
        {activeSession ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-700 animate-pulse">
            SESSION ACTIVE
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-surface-subtle text-slate-400 border border-surface-border">
            STANDBY
          </span>
        )}
      </div>

      {/* Timer & Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="text-3xl font-black tracking-widest text-slate-100 font-mono">
            {formatSeconds(elapsedSeconds)}
          </div>
          {activeSession?.task && (
            <div className="text-xs text-blue-400 mt-1">
              LINKED TASK: <span className="text-slate-200">{activeSession.task.title}</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {activeSession ? (
            <>
              <Button
                variant="danger"
                size="sm"
                onClick={handleCancel}
                disabled={isLoading}
                title="Discard session"
              >
                <XCircle className="h-4 w-4 mr-1.5" />
                CANCEL
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleComplete}
                isLoading={isLoading}
                className="bg-emerald-600 hover:bg-emerald-500 border-emerald-500"
              >
                <Square className="h-4 w-4 mr-1.5 fill-current" />
                COMPLETE SESSION
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleStart}
              isLoading={isLoading}
              className="bg-blue-600 hover:bg-blue-500"
            >
              <Play className="h-4 w-4 mr-1.5 fill-current" />
              START DEEP WORK
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
