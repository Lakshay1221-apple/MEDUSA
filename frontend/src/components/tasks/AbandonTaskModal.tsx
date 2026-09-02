'use client';

import React, { useState } from 'react';
import { Task } from '@/lib/types/domain';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Skull } from 'lucide-react';

export interface AbandonTaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onAbandon: (taskId: string, reason: string, commitmentPhrase: string, notes?: string) => Promise<void>;
  requiredPhrase?: string;
}

export function AbandonTaskModal({
  task,
  isOpen,
  onClose,
  onAbandon,
  requiredPhrase = 'I ACCEPT THE COST',
}: AbandonTaskModalProps) {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [commitmentPhrase, setCommitmentPhrase] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!task) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await onAbandon(task.id, reason, commitmentPhrase, notes);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="PERMANENTLY ABANDON TASK"
      description={`Task: ${task.title}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Consequence Banner */}
        <div className="rounded border border-red-800 bg-red-950/50 p-3 flex items-start space-x-3 text-xs font-mono text-red-300">
          <Skull className="h-5 w-5 shrink-0 mt-0.5 text-red-400" />
          <div className="space-y-1">
            <div className="font-bold uppercase tracking-wide">TERMINAL ACTION WARNING:</div>
            <ul className="list-disc list-inside space-y-0.5 text-slate-300">
              <li>Permanent cancellation. Task cannot be reopened.</li>
              <li>Maximum abandonment score penalty applied.</li>
              <li>Total abandoned count incremented in user stats.</li>
              <li>Triggers TASK_QUITTER rule engine evaluation.</li>
            </ul>
          </div>
        </div>

        <Input
          label="Mandatory Reason for Abandonment"
          type="text"
          placeholder="State definitive reason..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-mono font-medium tracking-wide uppercase text-slate-400">
            Debrief Notes (Optional)
          </label>
          <textarea
            className="w-full rounded bg-surface-muted px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 border border-surface-border font-mono transition-colors focus:outline-none focus:border-red-500"
            rows={2}
            placeholder="Lessons learned or failure analysis..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="space-y-1.5 pt-1">
          <Input
            label={`Type Commitment Phrase: "${requiredPhrase}"`}
            type="text"
            placeholder={requiredPhrase}
            value={commitmentPhrase}
            onChange={(e) => setCommitmentPhrase(e.target.value)}
            helperText="Required to confirm permanent abandonment."
            required
          />
        </div>

        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-surface-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            CANCEL
          </Button>
          <Button type="submit" variant="danger" size="sm" isLoading={isLoading}>
            CONFIRM PERMANENT ABANDONMENT
          </Button>
        </div>
      </form>
    </Modal>
  );
}
