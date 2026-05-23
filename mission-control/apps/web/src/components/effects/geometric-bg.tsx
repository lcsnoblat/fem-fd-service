'use client'

import { motion } from 'framer-motion'
import * as React from 'react'

// ─── SVG Grid ─────────────────────────────────────────────────────────────────

function SVGGrid() {
  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      animate={{ y: [0, -20, 0] }}
      transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="geo-grid-pattern"
            x="0"
            y="0"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="rgba(99,102,241,0.07)"
              strokeWidth="1"
            />
          </pattern>

          <radialGradient id="geo-grid-mask-gradient" cx="50%" cy="50%" r="60%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="70%" stopColor="white" stopOpacity="0.6" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>

          <mask id="geo-grid-mask">
            <rect width="100%" height="100%" fill="url(#geo-grid-mask-gradient)" />
          </mask>
        </defs>

        <rect
          width="100%"
          height="100%"
          fill="url(#geo-grid-pattern)"
          mask="url(#geo-grid-mask)"
        />
      </svg>
    </motion.div>
  )
}

// ─── Orb Glow ─────────────────────────────────────────────────────────────────

function OrbGlow() {
  return (
    <motion.div
      className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full pointer-events-none"
      style={{
        background: 'radial-gradient(circle at center, rgba(99,102,241,0.08) 0%, transparent 70%)',
      }}
      animate={{ y: [0, -15, 0] }}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      aria-hidden="true"
    />
  )
}

// ─── Floating Shapes ─────────────────────────────────────────────────────────

// Seeded positions — deterministic, no Math.random()
const SHAPES = [
  {
    id: 'triangle',
    x: '8%',
    y: '20%',
    duration: 14,
    delay: 0,
    opacity: 0.05,
    path: 'M20 4 L36 32 L4 32 Z',
    viewBox: '0 0 40 36',
  },
  {
    id: 'hexagon',
    x: '82%',
    y: '55%',
    duration: 18,
    delay: 2,
    opacity: 0.04,
    path: 'M20 2 L36 11 L36 29 L20 38 L4 29 L4 11 Z',
    viewBox: '0 0 40 40',
  },
  {
    id: 'diamond',
    x: '15%',
    y: '72%',
    duration: 12,
    delay: 4,
    opacity: 0.06,
    path: 'M20 2 L38 20 L20 38 L2 20 Z',
    viewBox: '0 0 40 40',
  },
  {
    id: 'circle',
    x: '70%',
    y: '12%',
    duration: 20,
    delay: 6,
    opacity: 0.05,
    path: '',
    viewBox: '0 0 40 40',
    isCircle: true,
  },
] as const

function FloatingShapes() {
  return (
    <>
      {SHAPES.map((shape) => (
        <motion.div
          key={shape.id}
          className="absolute pointer-events-none"
          style={{ left: shape.x, top: shape.y }}
          animate={{ y: [0, -12, 4, -8, 0] }}
          transition={{
            duration: shape.duration,
            delay: shape.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          aria-hidden="true"
        >
          <svg
            width="40"
            height="40"
            viewBox={shape.viewBox}
            fill="#6366F1"
            style={{ opacity: shape.opacity }}
            xmlns="http://www.w3.org/2000/svg"
          >
            {'isCircle' in shape && shape.isCircle ? (
              <circle cx="20" cy="20" r="16" />
            ) : (
              <path d={shape.path} />
            )}
          </svg>
        </motion.div>
      ))}
    </>
  )
}

// ─── Full Component ───────────────────────────────────────────────────────────

export function GeometricBackground() {
  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none -z-10"
      aria-hidden="true"
    >
      <SVGGrid />
      <OrbGlow />
      <FloatingShapes />
    </div>
  )
}
