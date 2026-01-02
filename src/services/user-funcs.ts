import { createServerFn } from '@tanstack/react-start'
import { requireUser } from './auth-helper'

export const getUserProfileFn = createServerFn({ method: "GET" })
  .handler(async () => {
    const { user, supabase } = await requireUser()

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') throw new Error(error.message)
    return profile || null
  })

export const updateUserProfileFn = createServerFn({ method: "POST" })
  .inputValidator((d: { 
    age_group?: 'kid' | 'teen' | 'adult'; 
    preferences?: any; 
    voice_enabled?: boolean; 
    language?: string;
    role?: 'user' | 'admin';
    provider?: 'email' | 'google';
  }) => d)
  .handler(async ({ data }) => {
    const { user, supabase } = await requireUser()

    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        ...data,
        updated_at: new Date().toISOString()
      })

    if (error) throw new Error(error.message)
    return { success: true }
  })
