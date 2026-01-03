import { SupabaseClient } from '@supabase/supabase-js'

// --- Types & Interfaces ---

export interface UserCostProfile {
  user_id: string
  subscription_tier: 'free' | 'pro_monthly' | 'pro_yearly'
  cost_used: number // in USD, strictly internal
  billing_cycle_start: string
  last_request_at?: string
  image_gens_count: number
}

export type ServiceTier = 'green' | 'yellow' | 'red' | 'black' // budget health

export interface AIRequestConfig {
  costOverride?: number // manual cost injection if needed
  type: 'text' | 'image' | 'voice'
}

export interface RoutingDecision {
  model: string // e.g., "gemini-1.5-pro", "gemini-1.5-flash", "gemini-nano"
  canProceed: boolean
  tier: ServiceTier
  imageResolution?: string
  isCached?: boolean
}

// --- Constants & Config ---

const PLAN_CAPS = {
  free: 0.02, // $0.02 (approx 1 high quality prompt)
  pro_monthly: 3.0, // $3.00 hard cap
  pro_yearly: 30.0, // $30.00 hard cap
}

// Estimated costs (Internal COGS)
const COSTS = {
  text_input_1k: 0.0001, // Flash rates
  text_output_1k: 0.0003,
  image_gen: 0.004, // Optimized image gen
  high_res_image: 0.02, // Premium image gen
}

const RATE_LIMIT_WINDOW = 5000 // 5 seconds in ms

// --- Main Service Class ---

export class AIGovernanceService {
  private serverClient: SupabaseClient

  constructor(serverClient: SupabaseClient) {
    this.serverClient = serverClient
  }

  // 1. Get Decision (Routing)
  async routeRequest(
    userId: string,
    requestType: 'text' | 'image',
  ): Promise<RoutingDecision> {
    const { data: profile, error } = await this.serverClient
      .from('profiles')
      .select(
        'subscription_tier, cost_used, billing_cycle_start, last_request_at',
      )
      .eq('user_id', userId)
      .single()

    if (error || !profile) {
      console.error('Governance: Profile not found', error)
      return { canProceed: false, model: 'none', tier: 'black' } // Fail safe
    }

    const tier = (profile.subscription_tier || 'free') as keyof typeof PLAN_CAPS
    const budgetCap = PLAN_CAPS[tier]
    const currentCost = profile.cost_used || 0
    const usagePercent = (currentCost / budgetCap) * 100

    // Abuse Check: Rate Limiting
    if (profile.last_request_at) {
      const last = new Date(profile.last_request_at).getTime()
      const now = new Date().getTime()
      if (now - last < RATE_LIMIT_WINDOW) {
        throw new Error('Please wait a moment before trying again.') // User friendly 429
      }
    }

    // Determine Logic State
    let state: ServiceTier = 'green'
    if (usagePercent >= 100) state = 'black'
    else if (usagePercent >= 80) state = 'red'
    else if (usagePercent >= 50) state = 'yellow'

    // Kill Switch
    if (state === 'black') {
      return {
        canProceed: false,
        model: 'cached', // In reality we'd return a specific error or cached obj
        tier: 'black',
        isCached: true,
      }
    }

    // Model Selection Matrix
    let selectedModel = 'gemini-3-flash-preview' // Default High
    let imageRes = '1024x1024'

    if (state === 'yellow') {
      selectedModel = 'gemini-3-flash-preview'
      imageRes = '512x512' // Optimization
    } else if (state === 'red') {
      selectedModel = 'gemini-3-flash-preview' // Lowest cost
      if (requestType === 'image') {
        // Disable image gen in red state to save budget
        return { canProceed: false, model: 'none', tier: 'red' }
      }
    }

    return {
      canProceed: true,
      model: selectedModel,
      tier: state,
      imageResolution: imageRes,
    }
  }

  // 2. Audit (Cost Tracking) - Call this AFTER the AI response
  async auditTransaction(
    userId: string,
    type: 'text' | 'image',
    tokensIn?: number,
    tokensOut?: number,
  ) {
    let cost = 0
    if (type === 'image') {
      cost = COSTS.image_gen // simplified
    } else {
      // Calculate text cost
      const inCost = ((tokensIn || 0) / 1000) * COSTS.text_input_1k
      const outCost = ((tokensOut || 0) / 1000) * COSTS.text_output_1k
      cost = inCost + outCost
    }

    // Atomic increment if possible, or read-write (PG has inc support but simplified here)
    // We will perform a simple RPC call or raw query in real prod, but here we do read-modify-write for simplicity
    // ignoring race conditions for MVP as it favors the user (under-counting)

    const { data: profile } = await this.serverClient
      .from('profiles')
      .select('cost_used, image_gens_count')
      .eq('user_id', userId)
      .single()

    const newCost = (profile?.cost_used || 0) + cost
    const newImageCount =
      (profile?.image_gens_count || 0) + (type === 'image' ? 1 : 0)

    await this.serverClient
      .from('profiles')
      .update({
        cost_used: newCost,
        image_gens_count: newImageCount,
        last_request_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
  }
}
