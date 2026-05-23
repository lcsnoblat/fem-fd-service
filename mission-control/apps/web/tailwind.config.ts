import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          2: '#F1F3F9',
        },
        // Module accent colors
        module: {
          finance: '#10B981',
          recipes: '#F97316',
          shopping: '#8B5CF6',
          jobs: '#3B82F6',
          calendar: '#EC4899',
          gallery: '#14B8A6',
          smarthome: '#F59E0B',
          reminders: '#EF4444',
          agent: '#6366F1',
          models: '#6B7280',
          reports: '#0EA5E9',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(15,21,35,0.06), 0 1px 2px rgba(15,21,35,0.04)',
        'card-hover': '0 4px 12px rgba(15,21,35,0.10), 0 2px 4px rgba(15,21,35,0.06)',
        dialog: '0 20px 60px rgba(15,21,35,0.15)',
        brand: '0 4px 14px rgba(99,102,241,0.3)',
      },
      borderRadius: {
        '3xl': '24px',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        float: 'float 6s ease-in-out infinite',
        'geo-drift': 'geoDrift 20s ease-in-out infinite',
        'pulse-slow': 'pulse 4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        geoDrift: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '25%': { transform: 'translate(8px, -8px)' },
          '50%': { transform: 'translate(-4px, -12px)' },
          '75%': { transform: 'translate(-8px, 4px)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
