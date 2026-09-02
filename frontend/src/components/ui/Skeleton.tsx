import React from 'react';
import { cn } from '@/lib/utils/classnames';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded bg-surface-subtle border border-surface-border/50', className)}
      {...props}
    />
  );
}
