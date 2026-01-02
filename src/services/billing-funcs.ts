import { createServerFn } from '@tanstack/react-start'
import { requireUser } from './auth-helper'
import { getSupabaseServerClient } from './supabase-server'

export const checkoutFn = createServerFn({ method: 'POST' })
  .inputValidator((d: { plan: 'pro_monthly' | 'pro_yearly' }) => d)
  .handler(async ({ data }) => {
    await requireUser()
    // Placeholder for Stripe Checkout integration
    console.log(`Creating checkout session for plan: ${data.plan}`)
    return {
      checkout_url: 'https://checkout.stripe.com/placeholder-session-id',
      status: 'success',
    }
  })

export const upgradeSubscriptionFn = createServerFn({ method: 'POST' })
  .inputValidator((d: { plan: 'pro_monthly' | 'pro_yearly' }) => d)
  .handler(async ({ data }) => {
    const { user } = await requireUser()
    const serverClient = getSupabaseServerClient()

    // Mock successful payment - upgrade user immediately
    const { error } = await serverClient.from('profiles').upsert({
      user_id: user.id,
      subscription_tier: data.plan,
      updated_at: new Date().toISOString(),
    })

    if (error) throw new Error('Failed to upgrade subscription')
    return { success: true }
  })
