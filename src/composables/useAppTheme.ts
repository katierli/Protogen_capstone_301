import { onMounted } from 'vue'
import { useTheme } from 'vuetify'

const STORAGE_KEY = 'ela-dashboard-theme'

/** Persists the user's light/dark choice and restores it (or the OS preference) on load. */
export function useAppTheme() {
  const theme = useTheme()

  function applyStoredPreference() {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'elaLight' || stored === 'elaDark') {
      theme.change(stored)
      return
    }
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      theme.change('elaDark')
    }
  }

  function toggleTheme() {
    const next = theme.global.current.value.dark ? 'elaLight' : 'elaDark'
    theme.change(next)
    localStorage.setItem(STORAGE_KEY, next)
  }

  onMounted(applyStoredPreference)

  return { theme, toggleTheme }
}
