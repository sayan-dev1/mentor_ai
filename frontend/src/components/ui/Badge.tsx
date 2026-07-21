import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'indigo' | 'purple' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'slate';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'indigo',
  size = 'md',
  icon,
  ...props
}) => {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
  };

  const variantStyles = {
    indigo: 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30',
    purple: 'bg-purple-500/10 text-purple-300 border border-purple-500/30',
    cyan: 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30',
    amber: 'bg-amber-500/10 text-amber-300 border border-amber-500/30',
    rose: 'bg-rose-500/10 text-rose-300 border border-rose-500/30',
    slate: 'bg-slate-800/60 text-slate-300 border border-slate-700/60',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center font-medium rounded-lg backdrop-blur-sm select-none',
          sizeStyles[size],
          variantStyles[variant],
          className
        )
      )}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
