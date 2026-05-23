import { GeometricBackground } from '@/components/effects/geometric-bg'

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
      <GeometricBackground />
      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  )
}
