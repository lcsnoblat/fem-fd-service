import * as React from 'react'

import { cn } from '@/lib/utils/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, id, type = 'text', ...props }, ref) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--color-text-primary)]"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span
              className="pointer-events-none absolute left-3 flex items-center text-[var(--color-text-muted)]"
              aria-hidden="true"
            >
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            type={type}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={
              error
                ? `${inputId}-error`
                : hint
                  ? `${inputId}-hint`
                  : undefined
            }
            className={cn(
              'h-9 w-full rounded-lg border bg-white px-3 text-sm',
              'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]',
              'transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-0',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-2',
              error
                ? 'border-[var(--color-error)] focus-visible:ring-[var(--color-error)]'
                : 'border-[var(--color-border)] hover:border-[var(--color-border-2)] focus-visible:border-brand-500',
              leftIcon && 'pl-9',
              rightIcon && 'pr-9',
              className,
            )}
            {...props}
          />

          {rightIcon && (
            <span
              className="pointer-events-none absolute right-3 flex items-center text-[var(--color-text-muted)]"
              aria-hidden="true"
            >
              {rightIcon}
            </span>
          )}
        </div>

        {error && (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="text-xs text-[var(--color-error)] flex items-center gap-1"
          >
            {error}
          </p>
        )}

        {!error && hint && (
          <p
            id={`${inputId}-hint`}
            className="text-xs text-[var(--color-text-muted)]"
          >
            {hint}
          </p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'

export { Input }
