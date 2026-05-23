'use client'

import { motion } from 'framer-motion'
import { signIn } from 'next-auth/react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

// ─── Google Icon ──────────────────────────────────────────────────────────────

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

// ─── Login Page ───────────────────────────────────────────────────────────────

export default function LoginPage() {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      setError(null)
      await signIn('google', { callbackUrl: '/' })
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-sm"
      >
        {/* Card */}
        <div
          className={cn(
            'rounded-2xl border border-[var(--color-border)] bg-white/90 p-8',
            'shadow-[0_8px_32px_rgba(15,21,35,0.10),0_2px_8px_rgba(15,21,35,0.06)]',
            'backdrop-blur-sm',
          )}
        >
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className={cn(
                'flex h-14 w-14 items-center justify-center rounded-2xl',
                'bg-gradient-to-br from-indigo-500 to-violet-600',
                'shadow-[0_4px_14px_rgba(99,102,241,0.35)]',
              )}
              aria-hidden="true"
            >
              <span className="text-2xl text-white">⬡</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.18 }}
              className="text-center"
            >
              <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
                Mission Control
              </h1>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Your personal command center
              </p>
            </motion.div>
          </div>

          {/* Sign in section */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.26 }}
            className="space-y-4"
          >
            <div className="text-center">
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Sign in to continue
              </h2>
              <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                Use your Google account to access your workspace
              </p>
            </div>

            <Button
              variant="secondary"
              size="lg"
              className="w-full justify-center gap-3 border-[var(--color-border)] hover:border-[var(--color-border-2)]"
              onClick={handleGoogleSignIn}
              loading={loading}
              disabled={loading}
            >
              {!loading && <GoogleIcon className="h-4 w-4 shrink-0" />}
              <span>Continue with Google</span>
            </Button>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                role="alert"
                className="text-center text-xs text-[var(--color-error)]"
              >
                {error}
              </motion.p>
            )}
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 text-center text-[10px] text-[var(--color-text-disabled)]"
          >
            By signing in you agree to our{' '}
            <a
              href="/terms"
              className="underline hover:text-[var(--color-text-muted)] transition-colors"
            >
              Terms of Service
            </a>{' '}
            and{' '}
            <a
              href="/privacy"
              className="underline hover:text-[var(--color-text-muted)] transition-colors"
            >
              Privacy Policy
            </a>
            .
          </motion.p>
        </div>
      </motion.div>
    </div>
  )
}
