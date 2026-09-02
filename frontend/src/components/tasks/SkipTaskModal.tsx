'use client';

import React, { useState } from 'react';
import { Task } from '@/lib/types/domain';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { AlertTriangle } from 'lucide-react';

export interface SkipTaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSkip: (taskId: string, reasonCode: string, commitmentPhrase: string, reasonText?: string) => Promise<void>;
  requiredPhrase?: string;
}

export function SkipTaskModal({
  task,
  isOpen,
  onClose,
  onSkip,
  requiredPhrase = 'I ACCEPT THE COST',
}: SkipTaskModalProps) {
  const [reasonCode, setReasonCode] = useState('SCHEDULE_CONFLICT');
  const [reasonText, setReasonText] = useState('');
  const [commitmentPhrase, setCommitmentPhrase] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!task) return null;

  const reasonOptions = [
    { value: 'SCHEDULE_CONFLICT', label: 'Schedule Conflict' },
    { value: 'ILLNESS', label: 'Illness / Medical' },
    { value: 'OVERESTIMATED_CAPACITY', label: 'Overestimated Capacity' },
    { value: 'OTHER', label: 'Other (Specify below)' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await onSkip(task.id, reasonCode, commitmentPhrase, reasonText);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="CONCEDE TASK (SKIP)"
      description={`Task: ${task.title}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Consequence Banner */}
        <div className="rounded border border-amber-800/80 bg-amber-950/40 p-3 flex items-start space-x-3 text-xs font-mono text-amber-300">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
          <div className="space-y-1">
            <div className="font-bold uppercase tracking-wide">CONSEQUENCES OF CONCESSION:</div>
            <ul className="list-disc list-inside space-y-0.5 text-slate-300">
              <li>Immediate authorative score penalty applied</li>
              <li>Current execution streak broken to 0</li>
              <li>Occurrence rescheduled to next eligible day</li>
            </ul>
          </div>
        </div>

        <Select
          label="Reason Code"
          value={reasonCode}
          onChange={(e) => setReasonCode(e.target.value)}
          options={reasonOptions}
          required
        />

        {reasonCode === 'OTHER' && (
          <Input
            label="Explanation (Mandatory for OTHER)"
            type="text"
            placeholder="State factual explanation..."
            value={reasonText}
            onChange={(e) => setReasonText(e.target.value)}
            required
          />
        )}

        <div className="space-y-1.5 pt-1">
          <Input
            label={`Type Commitment Phrase: "${requiredPhrase}"`}
            type="text"
            placeholder={requiredPhrase}
            value={commitmentPhrase}
            onChange={(e) => setCommitmentPhrase(e.target.value)}
            helperText="Case-insensitive verification required by backend state machine."
            required
          />
        </div>

        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-surface-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            CANCEL
          </Button>
          <Button type="submit" variant="warning" size="sm" isLoading={isLoading}>
            CONFIRM CONCESSION
          </Button>
        </div>
      </form>
    </Modal>
  );
}
