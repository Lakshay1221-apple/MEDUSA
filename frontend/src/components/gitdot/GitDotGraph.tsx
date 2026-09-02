'use client';

import React, { useState } from 'react';
import { GitDotCell, GitDotMode } from '@/lib/types/domain';
import { formatDuration, formatScoreDelta } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/classnames';

export interface GitDotGraphProps {
  cells: GitDotCell[];
  currentMode: GitDotMode;
  onModeChange: (mode: GitDotMode) => void;
  isLoading?: boolean;
}

export function GitDotGraph({
  cells,
  currentMode,
  onModeChange,
  isLoading,
}: GitDotGraphProps) {
  const [hoveredCell, setHoveredCell] = useState<GitDotCell | null>(null);

  const modes: Array<{ mode: GitDotMode; label: string }> = [
    { mode: 'EXECUTION', label: 'EXECUTION %' },
    { mode: 'SCORE', label: 'SCORE DELTA' },
    { mode: 'FOCUS', label: 'DEEP WORK' },
    { mode: 'TASKS', label: 'TASKS COMPLETED' },
    { mode: 'GITHUB', label: 'GITHUB VERIFIED' },
  ];

  // Level 0-5 color scales per mode
  const getCellColor = (level: number, mode: GitDotMode) => {
    switch (mode) {
      case 'SCORE':
        switch (level) {
          case 5: return 'bg-amber-400 border-amber-300';
          case 4: return 'bg-amber-500 border-amber-400';
          case 3: return 'bg-amber-600 border-amber-500';
          case 2: return 'bg-amber-800 border-amber-700';
          case 1: return 'bg-amber-950 border-amber-900';
          case 0:
          default: return 'bg-surface-subtle border-surface-border';
        }
      case 'FOCUS':
        switch (level) {
          case 5: return 'bg-cyan-400 border-cyan-300';
          case 4: return 'bg-cyan-500 border-cyan-400';
          case 3: return 'bg-cyan-600 border-cyan-500';
          case 2: return 'bg-cyan-800 border-cyan-700';
          case 1: return 'bg-cyan-950 border-cyan-900';
          case 0:
          default: return 'bg-surface-subtle border-surface-border';
        }
      case 'GITHUB':
        switch (level) {
          case 5: return 'bg-purple-400 border-purple-300';
          case 4: return 'bg-purple-500 border-purple-400';
          case 3: return 'bg-purple-600 border-purple-500';
          case 2: return 'bg-purple-800 border-purple-700';
          case 1: return 'bg-purple-950 border-purple-900';
          case 0:
          default: return 'bg-surface-subtle border-surface-border';
        }
      case 'TASKS':
      case 'EXECUTION':
      default:
        switch (level) {
          case 5: return 'bg-emerald-400 border-emerald-300';
          case 4: return 'bg-emerald-500 border-emerald-400';
          case 3: return 'bg-emerald-600 border-emerald-500';
          case 2: return 'bg-emerald-800 border-emerald-700';
          case 1: return 'bg-emerald-950 border-emerald-900';
          case 0:
          default: return 'bg-surface-subtle border-surface-border';
        }
    }
  };

  return (
    <div className="rounded-lg bg-surface border border-surface-border p-5 space-y-4 font-mono select-none">
      {/* Mode Selector Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-surface-border">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-200">
            GITDOT ACTIVITY MATRIX
          </h3>
          <p className="text-[11px] text-slate-400">
            Server-aggregated execution telemetry across 5 dimensions.
          </p>
        </div>

        {/* Mode Buttons */}
        <div className="flex items-center space-x-1 bg-surface-muted p-1 rounded border border-surface-border">
          {modes.map((m) => (
            <button
              key={m.mode}
              onClick={() => onModeChange(m.mode)}
              className={cn(
                'px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors',
                currentMode === m.mode
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200',
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Display */}
      {isLoading ? (
        <div className="h-28 flex items-center justify-center text-xs text-slate-500 animate-pulse">
          FETCHING ACTIVITY TELEMETRY...
        </div>
      ) : cells.length === 0 ? (
        <div className="h-28 flex items-center justify-center text-xs text-slate-500">
          NO ACTIVITY DATA RECORDED IN THIS ARC
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5 p-2 bg-surface-muted/40 rounded border border-surface-border/50 max-h-40 overflow-y-auto">
            {cells.map((cell) => (
              <div
                key={cell.date}
                onMouseEnter={() => setHoveredCell(cell)}
                className={cn(
                  'h-5 w-5 rounded-sm border transition-transform cursor-pointer hover:scale-125 relative group',
                  getCellColor(cell.level, currentMode),
                )}
              />
            ))}
          </div>

          {/* Telemetry Hover Info Bar */}
          <div className="h-8 flex items-center justify-between text-xs px-3 py-1.5 bg-surface-subtle rounded border border-surface-border">
            {hoveredCell ? (
              <div className="flex items-center space-x-4">
                <span className="font-bold text-slate-200">DATE: {hoveredCell.date}</span>
                <span className="text-emerald-400 font-semibold">
                  EXECUTION: {hoveredCell.execution_percent}%
                </span>
                <span className="text-slate-400">
                  TASKS: {hoveredCell.tasks_completed}/{hoveredCell.tasks_planned}
                </span>
                <span className="text-cyan-400">
                  DEEP WORK: {formatDuration(hoveredCell.deep_work_minutes)}
                </span>
                <span className="text-amber-400">
                  SCORE: {formatScoreDelta(hoveredCell.score_delta)}
                </span>
              </div>
            ) : (
              <span className="text-slate-500">Hover over any cell to inspect daily execution telemetry.</span>
            )}

            {/* Level Legend */}
            <div className="flex items-center space-x-1 text-[10px] text-slate-400">
              <span>MIN</span>
              {[0, 1, 2, 3, 4, 5].map((lvl) => (
                <span
                  key={lvl}
                  className={cn('h-3 w-3 rounded-xs border', getCellColor(lvl, currentMode))}
                />
              ))}
              <span>MAX</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
