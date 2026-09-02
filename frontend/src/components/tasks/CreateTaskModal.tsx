'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Category, TaskPriority, TaskStatus, VerificationType } from '@/lib/types/domain';
import { CreateTaskDto } from '@/lib/types/api';

export interface CreateTaskModalProps {
  arcId: string;
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onCreate: (dto: CreateTaskDto) => Promise<void>;
}

export function CreateTaskModal({
  arcId,
  categories,
  isOpen,
  onClose,
  onCreate,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [difficulty, setDifficulty] = useState(1);
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [scheduledDate, setScheduledDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [status, setStatus] = useState<TaskStatus>('PENDING');
  const [verificationType, setVerificationType] = useState<VerificationType>('MANUAL');
  const [isLoading, setIsLoading] = useState(false);

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const priorityOptions = [
    { value: 'LOW', label: 'LOW' },
    { value: 'MEDIUM', label: 'MEDIUM' },
    { value: 'HIGH', label: 'HIGH' },
    { value: 'CRITICAL', label: 'CRITICAL' },
  ];

  const statusOptions = [
    { value: 'PENDING', label: 'PENDING (Scheduled)' },
    { value: 'BACKLOG', label: 'BACKLOG (Unscheduled)' },
  ];

  const verificationOptions = [
    { value: 'MANUAL', label: 'MANUAL' },
    { value: 'GITHUB_COMMIT', label: 'GITHUB COMMIT' },
    { value: 'GITHUB_PR', label: 'GITHUB PR' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await onCreate({
        arc_id: arcId,
        title,
        description: description || undefined,
        category_id: categoryId || categories[0]?.id,
        estimated_minutes: estimatedMinutes,
        difficulty,
        priority,
        scheduled_date: status === 'PENDING' ? scheduledDate : undefined,
        status,
        verification_type: verificationType,
      });
      // Reset form
      setTitle('');
      setDescription('');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="CREATE NEW COMMITMENT"
      description="Inject an actionable task into the Arc execution graph."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Task Directive / Title"
          type="text"
          placeholder="e.g. Implement WebSocket gateway authentication"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-mono font-medium tracking-wide uppercase text-slate-400">
            Description & Criteria (Optional)
          </label>
          <textarea
            className="w-full rounded bg-surface-muted px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 border border-surface-border font-mono transition-colors focus:outline-none focus:border-blue-500"
            rows={2}
            placeholder="Technical details, acceptance criteria..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Category"
            value={categoryId || categories[0]?.id}
            onChange={(e) => setCategoryId(e.target.value)}
            options={categoryOptions}
          />
          <Select
            label="Priority Level"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            options={priorityOptions}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Est. Minutes"
            type="number"
            min={5}
            max={1440}
            value={estimatedMinutes}
            onChange={(e) => setEstimatedMinutes(parseInt(e.target.value, 10))}
            required
          />
          <Input
            label="Difficulty (1-5)"
            type="number"
            min={1}
            max={5}
            value={difficulty}
            onChange={(e) => setDifficulty(parseInt(e.target.value, 10))}
            required
          />
          <Select
            label="Verification Mode"
            value={verificationType}
            onChange={(e) => setVerificationType(e.target.value as VerificationType)}
            options={verificationOptions}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Initial Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            options={statusOptions}
          />
          {status === 'PENDING' && (
            <Input
              label="Scheduled Date"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              required
            />
          )}
        </div>

        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-surface-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            CANCEL
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
            COMMIT TASK
          </Button>
        </div>
      </form>
    </Modal>
  );
}
