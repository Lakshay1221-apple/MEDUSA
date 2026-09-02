'use client';

import React, { useState } from 'react';
import { Task } from '@/lib/types/domain';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export interface RescheduleTaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onReschedule: (
    taskId: string,
    scheduledDate: string,
    scheduledStart?: string,
    scheduledEnd?: string,
    reason?: string,
  ) => Promise<void>;
}

export function RescheduleTaskModal({
  task,
  isOpen,
  onClose,
  onReschedule,
}: RescheduleTaskModalProps) {
  const [scheduledDate, setScheduledDate] = useState(
    task?.scheduled_date || new Date().toISOString().split('T')[0],
  );
  const [scheduledStart, setScheduledStart] = useState(task?.scheduled_start || '');
  const [scheduledEnd, setScheduledEnd] = useState(task?.scheduled_end || '');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!task) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await onReschedule(
        task.id,
        scheduledDate,
        scheduledStart || undefined,
        scheduledEnd || undefined,
        reason || undefined,
      );
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="RESCHEDULE COMMITMENT"
      description={`Task: ${task.title}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Target Execution Date (YYYY-MM-DD)"
          type="date"
          value={scheduledDate}
          onChange={(e) => setScheduledDate(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Start Time (HH:mm)"
            type="time"
            value={scheduledStart}
            onChange={(e) => setScheduledStart(e.target.value)}
          />
          <Input
            label="End Time (HH:mm)"
            type="time"
            value={scheduledEnd}
            onChange={(e) => setScheduledEnd(e.target.value)}
          />
        </div>

        <Input
          label="Reschedule Reason (Optional)"
          type="text"
          placeholder="Operational adjustment..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-surface-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            CANCEL
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
            APPLY RESCHEDULE
          </Button>
        </div>
      </form>
    </Modal>
  );
}
