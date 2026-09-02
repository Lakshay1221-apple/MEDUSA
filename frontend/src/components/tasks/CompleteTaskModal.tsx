'use client';

import React, { useState } from 'react';
import { Task } from '@/lib/types/domain';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export interface CompleteTaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (taskId: string, actualMinutes?: number, notes?: string) => Promise<void>;
}

export function CompleteTaskModal({
  task,
  isOpen,
  onClose,
  onComplete,
}: CompleteTaskModalProps) {
  const [actualMinutes, setActualMinutes] = useState<number | undefined>(
    task?.estimated_minutes || 30,
  );
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!task) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await onComplete(task.id, actualMinutes, notes);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="RECORD TASK COMPLETION"
      description={`Task: ${task.title}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Actual Minutes Logged"
          type="number"
          min={1}
          max={1440}
          value={actualMinutes ?? ''}
          onChange={(e) => setActualMinutes(e.target.value ? parseInt(e.target.value, 10) : undefined)}
          required
        />
        <div className="space-y-1.5">
          <label className="block text-xs font-mono font-medium tracking-wide uppercase text-slate-400">
            Execution Notes (Optional)
          </label>
          <textarea
            className="w-full rounded bg-surface-muted px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 border border-surface-border font-mono transition-colors focus:outline-none focus:border-blue-500"
            rows={3}
            placeholder="Execution summary, links, or verification artifacts..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-surface-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            CANCEL
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
            RECORD EXECUTION
          </Button>
        </div>
      </form>
    </Modal>
  );
}
