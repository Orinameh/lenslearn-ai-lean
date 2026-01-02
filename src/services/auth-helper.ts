import { getSupabaseServerClient } from './supabase-server'

export const requireUser = async () => {
  const supabase = getSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Unauthorized')
  }

  return { user, supabase }
}
