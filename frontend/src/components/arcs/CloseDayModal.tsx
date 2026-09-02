'use client';

import React, { useState } from 'react';
import { ArcDay, Task } from '@/lib/types/domain';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

export interface CloseDayModalProps {
  arcDay: ArcDay | null;
  pendingTasks: Task[];
  isOpen: boolean;
  onClose: () => void;
  onCloseDay: (arcId: string, date: string) => Promise<void>;
}

export function CloseDayModal({
  arcDay,
  pendingTasks,
  isOpen,
  onClose,
  onCloseDay,
}: CloseDayModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!arcDay) return null;

  const hasPendingTasks = pendingTasks.length > 0;

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      await onCloseDay(arcDay.arc_id, arcDay.date);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`CLOSE EXECUTION DAY: ${arcDay.date}`}
      description="Authoritative daily reckoning. Unresolved commitments will be marked MISSED."
    >
      <div className="space-y-4 font-mono text-xs">
        {hasPendingTasks ? (
          <div className="rounded border border-red-800 bg-red-950/40 p-4 space-y-2 text-red-300">
            <div className="flex items-center space-x-2 font-bold uppercase tracking-wider text-red-400">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>UNRESOLVED COMMITMENTS DETECTED ({pendingTasks.length})</span>
            </div>
            <p className="text-slate-300">
              The following {pendingTasks.length} task(s) are still PENDING / IN PROGRESS. Closing
              the day now will mark them as <strong className="text-red-400">MISSED</strong> and{' '}
              <strong className="text-red-400">RESET YOUR CURRENT STREAK TO 0</strong>.
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 pt-1">
              {pendingTasks.map((t) => (
                <li key={t.id} className="truncate">
                  {t.title}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="rounded border border-emerald-800 bg-emerald-950/40 p-4 space-y-2 text-emerald-300">
            <div className="flex items-center space-x-2 font-bold uppercase tracking-wider text-emerald-400">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>ALL DAILY COMMITMENTS RESOLVED</span>
            </div>
            <p className="text-slate-300">
              Zero pending commitments remain. Closing this day will evaluate perfect day bonuses
              and increment your active execution streak.
            </p>
          </div>
        )}

        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-surface-border">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            CANCEL
          </Button>
          <Button
            variant={hasPendingTasks ? 'danger' : 'primary'}
            size="sm"
            onClick={handleConfirm}
            isLoading={isLoading}
          >
            CONFIRM AUTHORITATIVE CLOSURE
          </Button>
        </div>
      </div>
    </Modal>
  );
}
