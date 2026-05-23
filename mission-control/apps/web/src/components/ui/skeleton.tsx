import * as React from 'react'

import { cn } from '@/lib/utils/cn'

// Base shimmer skeleton
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md',
        'bg-gradient-to-r from-surface-2 via-[var(--color-border)] to-surface-2',
        'bg-[length:400%_100%]',
        className,
      )}
      aria-hidden="true"
      {...props}
    />
  )
}

// Single line skeleton with configurable width/height
interface SkeletonLineProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number
  height?: string | number
}

function SkeletonLine({ className, width, height, style, ...props }: SkeletonLineProps) {
  return (
    <Skeleton
      className={cn('h-4 rounded', className)}
      style={{
        width: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : '100%',
        height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : undefined,
        ...style,
      }}
      {...props}
    />
  )
}

// Block skeleton (for images/avatars/etc)
interface SkeletonBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number
  height?: string | number
}

function SkeletonBlock({ className, width, height, style, ...props }: SkeletonBlockProps) {
  return (
    <Skeleton
      className={cn('rounded-lg', className)}
      style={{
        width: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : '100%',
        height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : '120px',
        ...style,
      }}
      {...props}
    />
  )
}

// Pre-composed card skeleton
function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-xl border border-[var(--color-border)] bg-white p-6 shadow-card',
        className,
      )}
      aria-hidden="true"
      {...props}
    >
      {/* Header row: avatar + two lines */}
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="h-10 w-10 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonLine width="60%" />
          <SkeletonLine width="40%" height={12} />
        </div>
      </div>
      {/* Body lines */}
      <div className="space-y-2">
        <SkeletonLine />
        <SkeletonLine width="90%" />
        <SkeletonLine width="75%" />
      </div>
      {/* Footer */}
      <div className="flex gap-2 mt-4">
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-16 rounded-lg" />
      </div>
    </div>
  )
}

export { Skeleton, SkeletonBlock, SkeletonCard, SkeletonLine }
