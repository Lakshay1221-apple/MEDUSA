import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils/classnames';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, type = 'text', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-mono font-medium tracking-wide uppercase text-slate-400"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          type={type}
          className={cn(
            'flex h-10 w-full rounded bg-surface-muted px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 border border-surface-border font-mono transition-colors focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400 font-mono tracking-tight">{error}</p>}
        {helperText && !error && (
          <p className="text-xs text-slate-500 font-mono">{helperText}</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
