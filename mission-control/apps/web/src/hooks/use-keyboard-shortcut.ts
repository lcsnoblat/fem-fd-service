'use client'

import { useEffect } from 'react'

type KeyCombo = {
  key: string
  meta?: boolean
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
}

export function useKeyboardShortcut(combo: KeyCombo, callback: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const metaMatch = combo.meta ? e.metaKey || e.ctrlKey : true
      const ctrlMatch = combo.ctrl ? e.ctrlKey : true
      const shiftMatch = combo.shift ? e.shiftKey : !e.shiftKey
      const altMatch = combo.alt ? e.altKey : !e.altKey
      const keyMatch = e.key.toLowerCase() === combo.key.toLowerCase()

      // If meta is specified, don't also require non-meta state
      const modifierMatch =
        combo.meta || combo.ctrl
          ? (combo.meta ? e.metaKey || e.ctrlKey : e.ctrlKey) && shiftMatch && altMatch
          : metaMatch && ctrlMatch && shiftMatch && altMatch

      if (keyMatch && modifierMatch) {
        e.preventDefault()
        callback()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [combo, callback])
}
