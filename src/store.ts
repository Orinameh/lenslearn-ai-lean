// Simple transient store for POC to pass data between routes without persistence
// This resets on page reload, which is expected for a stateless POC

export const currentSessionStore = {
  data: null as {
    id: string
    imageUrl: string
    analysis: any
  } | null,

  set: (data: { id: string; imageUrl: string; analysis: any }) => {
    currentSessionStore.data = data
  },

  get: (id: string) => {
    if (currentSessionStore.data?.id === id) {
      return currentSessionStore.data
    }
    return null
  },

  clear: () => {
    currentSessionStore.data = null
  },
}

export const userPreferencesStore = {
  get: () => {
    if (typeof window === 'undefined')
      return { ageGroup: 'adult', learningStyle: 'balanced' }
    try {
      const stored = localStorage.getItem('lenslearn-prefs')
      return stored
        ? JSON.parse(stored)
        : { ageGroup: 'adult', learningStyle: 'balanced' }
    } catch {
      return { ageGroup: 'adult', learningStyle: 'balanced' }
    }
  },
  set: (prefs: { ageGroup: string; learningStyle: string }) => {
    if (typeof window === 'undefined') return
    localStorage.setItem('lenslearn-prefs', JSON.stringify(prefs))
  },
}
