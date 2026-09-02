import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GitDotGraph } from '@/components/gitdot/GitDotGraph';
import { GitDotCell } from '@/lib/types/domain';

describe('GitDotGraph Component', () => {
  const mockCells: GitDotCell[] = [
    {
      date: '2026-09-01',
      level: 5,
      execution_percent: 100,
      tasks_completed: 5,
      tasks_planned: 5,
      deep_work_minutes: 180,
      score_delta: 75,
    },
    {
      date: '2026-09-02',
      level: 2,
      execution_percent: 50,
      tasks_completed: 2,
      tasks_planned: 4,
      deep_work_minutes: 60,
      score_delta: 20,
    },
  ];

  it('renders graph header, modes, and legend', () => {
    render(
      <GitDotGraph
        cells={mockCells}
        currentMode="EXECUTION"
        onModeChange={vi.fn()}
      />,
    );

    expect(screen.getByText('GITDOT ACTIVITY MATRIX')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /execution %/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /score delta/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /deep work/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /github verified/i })).toBeInTheDocument();
  });

  it('triggers onModeChange when switching tabs', () => {
    const onModeChange = vi.fn();
    render(
      <GitDotGraph
        cells={mockCells}
        currentMode="EXECUTION"
        onModeChange={onModeChange}
      />,
    );

    const scoreModeBtn = screen.getByRole('button', { name: /score delta/i });
    fireEvent.click(scoreModeBtn);

    expect(onModeChange).toHaveBeenCalledWith('SCORE');
  });
});
