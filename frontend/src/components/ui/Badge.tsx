import React from 'react';
import { cn } from '@/lib/utils/classnames';
import { TaskStatus, TaskPriority, VerificationStatus } from '@/lib/types/domain';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'outline';
  status?: TaskStatus;
  priority?: TaskPriority;
  verification?: VerificationStatus;
}

export function Badge({
  className,
  variant = 'default',
  status,
  priority,
  verification,
  children,
  ...props
}: BadgeProps) {
  let computedVariant = variant;
  let label = children;

  if (status) {
    label = status;
    switch (status) {
      case 'COMPLETED':
        computedVariant = 'success';
        break;
      case 'IN_PROGRESS':
        computedVariant = 'info';
        break;
      case 'SKIPPED':
      case 'RESCHEDULED':
        computedVariant = 'warning';
        break;
      case 'ABANDONED':
      case 'MISSED':
        computedVariant = 'danger';
        break;
      case 'PENDING':
      case 'BACKLOG':
      default:
        computedVariant = 'outline';
        break;
    }
  }

  if (priority) {
    label = `${priority}`;
    switch (priority) {
      case 'CRITICAL':
        computedVariant = 'danger';
        break;
      case 'HIGH':
        computedVariant = 'warning';
        break;
      case 'MEDIUM':
        computedVariant = 'info';
        break;
      case 'LOW':
      default:
        computedVariant = 'outline';
        break;
    }
  }

  if (verification) {
    label = `GH:${verification}`;
    switch (verification) {
      case 'VERIFIED':
        computedVariant = 'success';
        break;
      case 'REJECTED':
        computedVariant = 'danger';
        break;
      case 'PENDING':
        computedVariant = 'warning';
        break;
      case 'UNVERIFIED':
      default:
        computedVariant = 'outline';
        break;
    }
  }

  const variants = {
    default: 'bg-surface-subtle text-slate-300 border-surface-border',
    success: 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60',
    warning: 'bg-amber-950/70 text-amber-300 border-amber-700/60',
    danger: 'bg-red-950/70 text-red-300 border-red-700/60',
    info: 'bg-blue-950/70 text-blue-300 border-blue-700/60',
    purple: 'bg-purple-950/70 text-purple-300 border-purple-700/60',
    outline: 'bg-transparent text-slate-400 border-surface-border',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider border select-none',
        variants[computedVariant],
        className,
      )}
      {...props}
    >
      {label}
    </span>
  );
}
