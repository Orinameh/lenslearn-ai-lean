import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { supabase } from './supabase'
import { getSupabaseServerClient } from './supabase-server'
import { getRequest } from '@tanstack/react-start/server'

export const EmailOtpSchema = z.object({
  email: z.email('Invalid email address'),
  provider: z.enum(['email', 'google']).optional(),
  name: z.string().optional(),
  role: z.enum(['user', 'admin']).default('user').optional(),
})

export const VerifyOtpSchema = z.object({
  email: z.email('Invalid email address'),
  token: z.string().min(8, 'Token must be 8 digits'),
})

export const sendOtpFn = createServerFn({ method: 'POST' })
  .inputValidator(EmailOtpSchema)
  .handler(async ({ data }) => {
    const { email, name, role } = data

    const options: any = {
      // We still define this for magic link fallback, but user wants OTP code
      emailRedirectTo: `${process.env.VITE_SUPABASE_URL || 'http://localhost:3000'}/auth/callback`,
      shouldCreateUser: true,
    }

    const metadata: any = {}
    if (name) metadata.full_name = name
    if (role) metadata.role = role

    if (Object.keys(metadata).length > 0) {
      options.data = metadata
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      ...options,
    })

    if (error) throw new Error(error.message)

    return { success: true }
  })

export const verifyOtpFn = createServerFn({ method: 'POST' })
  .inputValidator(VerifyOtpSchema)
  .handler(async ({ data }) => {
    const { email, token } = data
    const serverClient = getSupabaseServerClient()

    const { data: sessionData, error } = await serverClient.auth.verifyOtp({
      email,
      token,
      type: 'email',
    })

    if (error) throw new Error(error.message)

    // Update profile with comprehensive user details
    if (sessionData.user) {
      await serverClient.from('profiles').upsert({
        user_id: sessionData.user.id,
        email: sessionData.user.email,
        full_name: sessionData.user.user_metadata?.full_name,
        role: sessionData.user.user_metadata?.role || 'user',
        provider: 'email',
        updated_at: new Date().toISOString(),
      })
    }

    return sessionData
  })

export const logoutUserFn = createServerFn({ method: 'POST' }).handler(
  async () => {
    const serverClient = getSupabaseServerClient()
    await serverClient.auth.signOut()

    return { success: true }
  },
)

export const checkSessionFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const serverClient = getSupabaseServerClient()
    const {
      data: { user },
      error,
    } = await serverClient.auth.getUser()

    if (error || !user) return null
    return { user }
  },
)

export const signInWithGoogleFn = createServerFn({ method: 'POST' }).handler(
  async () => {
    const serverClient = getSupabaseServerClient()

    // Get the request to build the correct redirect URL
    const request = getRequest()
    const origin = new URL(request.url).origin

    const { data, error } = await serverClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin || 'http://localhost:3000'}/auth/callback`,
        // Force PKCE code flow
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) throw new Error(error.message)
    return { url: data?.url }
  },
)
