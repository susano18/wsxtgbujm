import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">
            {label}
          </label>
        ) }
        <input
          ref={ref}
          className={cn(
            'flex h-12 w-full rounded-xl border bg-white/50 dark:bg-slate-900/50 px-4 py-2 text-sm transition-all outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 dark:text-white',
            error ? 'border-error ring-error/20' : 'border-slate-200 dark:border-slate-800',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-error font-medium ml-1 animate-in fade-in slide-in-from-top-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
