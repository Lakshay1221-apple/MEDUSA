import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SkipTaskModal } from '@/components/tasks/SkipTaskModal';
import { Task } from '@/lib/types/domain';

describe('SkipTaskModal Component', () => {
  const mockTask: Task = {
    id: 'task-123',
    user_id: 'user-1',
    arc_id: 'arc-1',
    title: 'Drill Memory Allocator',
    origin: 'USER',
    user_modified: false,
    category_id: 'cat-1',
    estimated_minutes: 45,
    difficulty: 2,
    priority: 'MEDIUM',
    status: 'PENDING',
    verification_type: 'MANUAL',
    verification_status: 'UNVERIFIED',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it('renders modal with consequence warnings and form inputs', () => {
    render(
      <SkipTaskModal
        task={mockTask}
        isOpen={true}
        onClose={vi.fn()}
        onSkip={vi.fn()}
        requiredPhrase="I ACCEPT THE COST"
      />,
    );

    expect(screen.getByText('CONCEDE TASK (SKIP)')).toBeInTheDocument();
    expect(screen.getByText(/CONSEQUENCES OF CONCESSION/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/reason code/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('I ACCEPT THE COST')).toBeInTheDocument();
  });

  it('calls onSkip with reason and commitment phrase when submitted', async () => {
    const onSkip = vi.fn().mockResolvedValue(undefined);
    render(
      <SkipTaskModal
        task={mockTask}
        isOpen={true}
        onClose={vi.fn()}
        onSkip={onSkip}
        requiredPhrase="I ACCEPT THE COST"
      />,
    );

    const input = screen.getByPlaceholderText('I ACCEPT THE COST');
    fireEvent.change(input, { target: { value: 'I ACCEPT THE COST' } });

    const submitBtn = screen.getByRole('button', { name: /confirm concession/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onSkip).toHaveBeenCalledWith(
        'task-123',
        'SCHEDULE_CONFLICT',
        'I ACCEPT THE COST',
        '',
      );
    });
  });
});
