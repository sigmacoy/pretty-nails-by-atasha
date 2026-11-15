'use client';

import { forwardRef, ImgHTMLAttributes, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils';

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, name, size = 'md', ...props }, ref) => {
    const showFallback = !src || (typeof window !== 'undefined' && false); // Will handle error in onError

    return (
      <div
        ref={ref}
        className={cn('relative flex shrink-0 overflow-hidden rounded-full', sizeClasses[size], className)}
        {...props}
      >
        {src && !showFallback ? (
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            className="aspect-square h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
            {name ? getInitials(name) : '?'}
          </div>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export interface AvatarImageProps extends ImgHTMLAttributes<HTMLImageElement> {}

const AvatarImage = forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ className, ...props }, ref) => (
    <img
      ref={ref}
      className={cn('aspect-square h-full w-full object-cover', className)}
      {...props}
    />
  )
);
AvatarImage.displayName = 'AvatarImage';

export interface AvatarFallbackProps extends HTMLAttributes<HTMLDivElement> {}

const AvatarFallback = forwardRef<HTMLDivElement, AvatarFallbackProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex h-full w-full items-center justify-center rounded-full bg-muted', className)}
      {...props}
    />
  )
);
AvatarFallback.displayName = 'AvatarFallback';

export { Avatar, AvatarImage, AvatarFallback };