import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskCard } from '@/components/tasks/TaskCard';
import { Task } from '@/lib/types/domain';

describe('TaskCard Component', () => {
  const mockTask: Task = {
    id: 'task-123',
    user_id: 'user-1',
    arc_id: 'arc-1',
    title: 'Implement WebSocket Authentication',
    description: 'Enforce JWT authentication on connection',
    origin: 'USER',
    user_modified: false,
    category_id: 'cat-1',
    estimated_minutes: 60,
    difficulty: 3,
    priority: 'HIGH',
    scheduled_date: '2026-09-03',
    status: 'PENDING',
    verification_type: 'MANUAL',
    verification_status: 'UNVERIFIED',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: {
      id: 'cat-1',
      name: 'Backend',
      slug: 'backend',
      priority: 1,
      weekly_target_minutes: 600,
      created_at: new Date().toISOString(),
    },
  };

  it('renders task details and badges properly', () => {
    render(<TaskCard task={mockTask} />);

    expect(screen.getByText('Implement WebSocket Authentication')).toBeInTheDocument();
    expect(screen.getByText('PENDING')).toBeInTheDocument();
    expect(screen.getByText('HIGH')).toBeInTheDocument();
    expect(screen.getByText('Backend')).toBeInTheDocument();
    expect(screen.getByText('D3')).toBeInTheDocument();
    expect(screen.getByText('1h')).toBeInTheDocument();
  });

  it('triggers onComplete callback when DONE button is clicked', () => {
    const onComplete = vi.fn();
    render(<TaskCard task={mockTask} onComplete={onComplete} />);

    const doneButton = screen.getByRole('button', { name: /done/i });
    fireEvent.click(doneButton);

    expect(onComplete).toHaveBeenCalledWith(mockTask);
  });

  it('triggers onSkip callback when SKIP button is clicked', () => {
    const onSkip = vi.fn();
    render(<TaskCard task={mockTask} onSkip={onSkip} />);

    const skipButton = screen.getByRole('button', { name: /skip/i });
    fireEvent.click(skipButton);

    expect(onSkip).toHaveBeenCalledWith(mockTask);
  });
});
