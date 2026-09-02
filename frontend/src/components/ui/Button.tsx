import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils/classnames';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 select-none uppercase tracking-wider font-mono';

    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700 shadow-sm border border-blue-500/50',
      secondary: 'bg-surface-subtle text-slate-200 hover:bg-surface-accent border border-surface-border active:bg-surface-muted',
      danger: 'bg-red-950/80 text-red-300 hover:bg-red-900 border border-red-700/60 active:bg-red-950 shadow-glow-red',
      warning: 'bg-amber-950/80 text-amber-300 hover:bg-amber-900 border border-amber-700/60 active:bg-amber-950 shadow-glow-amber',
      outline: 'bg-transparent text-slate-300 hover:bg-surface-muted border border-surface-border hover:border-slate-500',
      ghost: 'bg-transparent text-slate-400 hover:text-slate-100 hover:bg-surface-muted',
    };

    const sizes = {
      sm: 'h-8 px-2.5 text-xs rounded',
      md: 'h-10 px-4 text-xs rounded',
      lg: 'h-12 px-6 text-sm rounded',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
