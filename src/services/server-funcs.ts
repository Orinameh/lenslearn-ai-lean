import { createServerFn } from '@tanstack/react-start'
import { analyzeScene, getExplanation } from '../services/gemini'
import { requireUser } from './auth-helper'
import { getSupabaseServerClient } from './supabase-server'
import { AIGovernanceService } from './ai-governance'

export const analyzeSceneFn = createServerFn({ method: 'POST' })
  .inputValidator((d: { base64: string; mimeType: string }) => d)
  .handler(async ({ data }) => {
    const { user, supabase } = await requireUser()
    const serverClient = getSupabaseServerClient()
    const governance = new AIGovernanceService(serverClient)

    // 1. Governance Routing
    let decision
    try {
      decision = await governance.routeRequest(user.id, 'image')
    } catch (error: any) {
      throw new Error(error.message)
    }

    if (!decision.canProceed) {
      if (decision.tier === 'black') {
        throw new Error(
          'Monthly plan limit reached. Please upgrade or wait for renewal.',
        )
      } else if (decision.tier === 'red') {
        throw new Error(
          'High-resolution generation temporarily paused due to heavy usage. Try text-only learning.',
        )
      }
      throw new Error('PAYMENT_REQUIRED')
    }

    // Fetch profile for Gemini personalization
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // 2. Execute AI Service
    const buffer = Buffer.from(data.base64, 'base64')
    // Pass model config to analyzeScene (need to update signature)
    const result = await analyzeScene(
      buffer,
      data.mimeType,
      profile,
      decision.model,
    )

    // 3. Audit Cost (Async)
    // We assume standard cost for image gen for now
    await governance.auditTransaction(user.id, 'image')

    return result
  })

export const getExplanationFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (d: {
      context: string
      question: string
      history?: { role: string; text: string }[]
    }) => d,
  )
  .handler(async ({ data }) => {
    const { user, supabase } = await requireUser()
    const serverClient = getSupabaseServerClient()
    const governance = new AIGovernanceService(serverClient)

    // 1. Governance Routing
    let decision
    try {
      decision = await governance.routeRequest(user.id, 'text')
    } catch (error: any) {
      throw new Error(error.message)
    }

    if (!decision.canProceed) {
      if (decision.tier === 'black') {
        // Fallback to "Cached" content simulation
        return 'You have reached your learning limit for this month. Please review your previous sessions.'
      }
      throw new Error('PAYMENT_REQUIRED')
    }

    // Fetch profile for personalization
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // 2. Execute AI Service
    // Pass model to getExplanation
    const result = await getExplanation(
      data.context,
      data.question,
      profile,
      decision.model,
      data.history || [],
    )

    // 3. Audit Cost (Async)
    // Estimate tokens (simple)
    const tokensIn = (data.context.length + data.question.length) / 4
    const tokensOut = result.length / 4
    await governance.auditTransaction(user.id, 'text', tokensIn, tokensOut)

    return result
  })
