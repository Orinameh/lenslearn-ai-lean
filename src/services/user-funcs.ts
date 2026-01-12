import { createServerFn } from '@tanstack/react-start'

export const getUserProfileFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    // POC: Return static Pro profile
    return {
      user_id: 'demo-user-123',
      email: 'demo@lenslearn.ai',
      full_name: 'Demo User',
      subscription_tier: 'pro_yearly', // Unlimited access
      cost_used: 0,
      image_gens_count: 0,
      voice_enabled: true,
      role: 'user',
      preferences: {
        theme: 'light',
        language: 'en',
      },
    }
  },
)

export const updateUserProfileFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (d: {
      age_group?: 'kid' | 'teen' | 'adult'
      preferences?: any
      voice_enabled?: boolean
      language?: string
      role?: 'user' | 'admin'
      provider?: 'email' | 'google'
    }) => d,
  )
  .handler(async ({ data }) => {
    // POC: Do nothing, just return success
    console.log('[POC] Mocking profile update:', data)
    return { success: true }
  })
