import { createServerClient, parseCookieHeader } from '@supabase/ssr'
import { getRequest, setCookie } from '@tanstack/react-start/server'
import { createClient } from '@supabase/supabase-js'

export const getSupabaseServerClient = () => {
  const request = getRequest()

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error('Supabase environment variables are missing')
  }

  return createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(request?.headers.get('Cookie') ?? '').map(
          (c) => ({
            name: c.name,
            value: c.value ?? '',
          }),
        )
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          setCookie(name, value, options),
        )
      },
    },
  })
}

export const getSupabaseAdminClient = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SECRET_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase admin environment variables are missing')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
