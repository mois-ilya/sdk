import { useState, useCallback, useEffect } from 'react'

const STORAGE_KEYS = {
  QA_MODE: 'devtools:qa-mode',
  ERUDA: 'devtools:eruda',
  UNLOCKED: 'devtools:unlocked',
} as const

export function useDevTools() {
  // DevTools visibility (persisted in localStorage)
  const [isUnlocked, setIsUnlockedState] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.UNLOCKED) === 'true'
  })

  // QA Mode state (read from localStorage, set triggers reload)
  const [qaMode] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.QA_MODE) === 'true'
  })

  // Eruda state
  const [erudaEnabled, setErudaEnabledState] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.ERUDA) === 'true'
  })

  // Unlock DevTools (called from secret tap)
  const unlockDevTools = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.UNLOCKED, 'true')
    setIsUnlockedState(true)
  }, [])

  // Lock DevTools (hide the tab)
  const lockDevTools = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.UNLOCKED)
    setIsUnlockedState(false)
  }, [])

  // Set QA Mode (triggers page reload)
  const setQaMode = useCallback((enabled: boolean) => {
    if (enabled) {
      localStorage.setItem(STORAGE_KEYS.QA_MODE, 'true')
    } else {
      localStorage.removeItem(STORAGE_KEYS.QA_MODE)
    }
    // Reload is required for QA Mode to take effect
    window.location.reload()
  }, [])

  // Set Eruda (dynamic load/destroy)
  const setErudaEnabled = useCallback(async (enabled: boolean) => {
    if (enabled) {
      localStorage.setItem(STORAGE_KEYS.ERUDA, 'true')
      const eruda = await import('eruda')
      eruda.default.init()
    } else {
      localStorage.removeItem(STORAGE_KEYS.ERUDA)
      const eruda = await import('eruda')
      eruda.default.destroy()
    }
    setErudaEnabledState(enabled)
  }, [])

  // Initialize eruda on mount if enabled
  useEffect(() => {
    if (erudaEnabled) {
      import('eruda').then(eruda => eruda.default.init())
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset all DevTools settings
  const resetAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.QA_MODE)
    localStorage.removeItem(STORAGE_KEYS.ERUDA)
    localStorage.removeItem(STORAGE_KEYS.UNLOCKED)
    window.location.reload()
  }, [])

  return {
    isUnlocked,
    unlockDevTools,
    lockDevTools,
    qaMode,
    setQaMode,
    erudaEnabled,
    setErudaEnabled,
    resetAll,
  }
}
