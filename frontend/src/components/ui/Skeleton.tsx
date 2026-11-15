'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'text', width, height, ...props }, ref) => {
    const baseStyles = 'animate-pulse rounded bg-muted overflow-hidden';

    const variants = {
      text: 'h-4 w-full',
      circular: 'rounded-full',
      rectangular: 'rounded-lg',
    };

    return (
      <div
        ref={ref}
        className={cn(baseStyles, variants[variant], className)}
        style={{ width, height }}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

export interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} variant="text" width={i === lines - 1 ? '60%' : '100%'} />
      ))}
    </div>
  );
}

export interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div className={cn('space-y-4 p-6 border rounded-xl bg-card', className)}>
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="space-y-2 flex-1">
          <Skeleton variant="text" width="40%" />
          <Skeleton variant="text" width="60%" />
        </div>
      </div>
      <Skeleton variant="rectangular" height={120} />
      <div className="flex gap-2">
        <Skeleton variant="text" width="80px" />
        <Skeleton variant="text" width="80px" />
      </div>
    </div>
  );
}

export { Skeleton };