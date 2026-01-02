import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { supabase } from './supabase'
import { getSupabaseServerClient } from './supabase-server'

export const RegisterSchema = z.object({
  email: z.email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(
      /[^a-zA-Z0-9]/,
      'Password must contain at least one special character',
    ),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  provider: z.enum(['email', 'google']).optional(),
  role: z.enum(['user', 'admin']).default('user').optional(),
})

export const LoginSchema = z.object({
  email: z.email('Invalid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(
      /[^a-zA-Z0-9]/,
      'Password must contain at least one special character',
    ),
  provider: z.enum(['email', 'google']).optional(),
})

// Manual bcrypt hashing with random salt
const hashPassword = (password: string) => {
  return bcrypt.hashSync(password, 10)
}

export const registerUserFn = createServerFn({ method: 'POST' })
  .inputValidator(RegisterSchema)
  .handler(async ({ data }) => {
    const { email, password, name, provider = 'email' } = data
    const hashedPassword = hashPassword(password)

    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password: hashedPassword,
      options: {
        data: {
          full_name: name,
        },
      },
    })

    console.log(authData, error)

    if (error) throw new Error(error.message)

    // Create/Update profile with provider info and password hash
    if (authData.user) {
      try {
        const serverClient = getSupabaseServerClient()
        const { error: profileError } = await serverClient
          .from('profiles')
          .upsert({
            user_id: authData.user.id,
            email: email,
            password: hashedPassword,
            full_name: name,
            provider: provider,
            role: data.role || 'user',
            updated_at: new Date().toISOString(),
          })

        if (profileError) {
          console.error('Failed to create profile:', profileError)
          // If upsert fails, we should probably rollback the auth user creation or throw
          throw new Error('Failed to create user profile')
        }
      } catch (err: any) {
        console.error('Profile creation error:', err)
        // Attempt to clean up auth user if profile fails?
        // For now, easier to throw so user knows something went wrong.
        throw new Error(err.message || 'Failed to initialize user profile')
      }
    }

    return authData
  })

export const loginUserFn = createServerFn({ method: 'POST' })
  .inputValidator(LoginSchema)
  .handler(async ({ data }) => {
    const { email, password, provider = 'email' } = data

    // 1. Fetch the stored hash from the profiles table
    const serverClient = getSupabaseServerClient()
    const { data: profile, error: profileError } = await serverClient
      .from('profiles')
      .select('password')
      .eq('email', email)
      .single()
    console.log(profile, profileError)
    if (profileError || !profile?.password) {
      throw new Error('User not found or password not set')
    }

    // 2. Manually compare the plain password with the stored hash
    const isPasswordCorrect = bcrypt.compareSync(password, profile.password)
    if (!isPasswordCorrect) {
      throw new Error('Invalid password')
    }

    // 3. Log into Supabase Auth using the STORED HASH as the password
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password: profile.password,
    })

    if (error) throw new Error(error.message)

    // Update profile with provider info for analytics
    if (authData.user) {
      const serverClient = getSupabaseServerClient()
      await serverClient.from('profiles').upsert({
        user_id: authData.user.id,
        provider: provider,
        updated_at: new Date().toISOString(),
      })
    }

    return authData
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
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/auth/callback`,
      },
    })

    if (error) throw new Error(error.message)
    return data
  },
)
