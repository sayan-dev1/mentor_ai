import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'card' | 'circle' | 'button';
}

export const LoadingSkeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'text',
  ...props
}) => {
  const variantClasses = {
    text: 'h-4 w-full rounded-md',
    card: 'h-32 w-full rounded-xl',
    circle: 'h-10 w-10 rounded-full',
    button: 'h-10 w-28 rounded-xl',
  };

  return (
    <div
      className={twMerge(
        clsx(
          'animate-pulse bg-slate-800/60 dark:bg-slate-800/40 border border-white/5',
          variantClasses[variant],
          className
        )
      )}
      {...props}
    />
  );
};
