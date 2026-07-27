import { createContext, useContext, useEffect, useState } from 'react'

/**
 * Theme values:
 *   'light'  — always light
 *   'dark'   — always dark
 *   'system' — follows OS preference (default)
 */

const ThemeContext = createContext(null)

// ── Helpers ───────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'senarichinese-theme'

/** Read persisted preference, fall back to 'system' */
function getStoredTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'system'
  } catch {
    return 'system'
  }
}

/** Returns true when the OS is in dark mode */
function systemPrefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/** Apply or remove the `dark` class on <html> */
function applyTheme(theme) {
  const root = document.documentElement
  const isDark = theme === 'dark' || (theme === 'system' && systemPrefersDark())
  root.classList.toggle('dark', isDark)
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getStoredTheme)

  // Apply on mount and whenever theme changes
  useEffect(() => {
    applyTheme(theme)
    try { localStorage.setItem(STORAGE_KEY, theme) } catch { /* ignore */ }
  }, [theme])

  // Re-apply when OS preference changes (only relevant in 'system' mode)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => { if (theme === 'system') applyTheme('system') }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  /** Cycle: light → dark → system → light */
  function toggleTheme() {
    setThemeState(prev =>
      prev === 'light' ? 'dark' : prev === 'dark' ? 'system' : 'light'
    )
  }

  /** Set an explicit value */
  function setTheme(value) {
    setThemeState(value)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * useTheme()
 * Returns { theme, toggleTheme, setTheme }
 *   theme       — 'light' | 'dark' | 'system'
 *   toggleTheme — cycles through the three modes
 *   setTheme    — set an explicit mode
 */
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}
