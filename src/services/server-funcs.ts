import { createServerFn } from '@tanstack/react-start'
import { analyzeScene, getExplanation } from '../services/gemini'
import { requireUser } from './auth-helper'
import { getSupabaseServerClient } from './supabase-server'
import { AIGovernanceService } from './ai-governance'

export const processMediaAnalysisFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (d: { base64: string; fileName: string; fileType: string }) => d,
  )
  .handler(async ({ data }) => {
    const { user, supabase } = await requireUser()
    const serverClient = getSupabaseServerClient()
    const governance = new AIGovernanceService(serverClient)

    // 1. Governance & Routing
    let decision
    try {
      decision = await governance.routeRequest(user.id, 'image')
    } catch (error: any) {
      throw new Error(error.message)
    }

    if (!decision.canProceed) {
      if (decision.tier === 'black') {
        throw new Error('Monthly plan limit reached.')
      }
      throw new Error('PAYMENT_REQUIRED')
    }

    // Prepare for parallel execution
    const timestamp = Date.now()
    const sanitizedFileName = data.fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const uniqueFileName = `${user.id}/${timestamp}-${sanitizedFileName}`
    const buffer = Buffer.from(data.base64, 'base64')

    // 2. Fetch profile first (fast) to ensure AI personalization
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // 3. Parallel Execution: Storage Upload + AI Analysis
    // Overlapping these two long-running tasks for maximum performance
    try {
      const [uploadResult, analysisResult] = await Promise.all([
        // Task A: Storage Upload
        serverClient.storage
          .from('media-uploads')
          .upload(uniqueFileName, buffer, {
            contentType: data.fileType,
            upsert: false,
          }),

        // Task B: AI Scene Analysis (Personalized)
        analyzeScene(buffer, data.fileType, profile, decision.model),
      ])

      if (uploadResult.error) {
        throw new Error(`Upload failed: ${uploadResult.error.message}`)
      }

      const {
        data: { publicUrl },
      } = serverClient.storage
        .from('media-uploads')
        .getPublicUrl(uniqueFileName)

      // 4. Audit & Final DB Insert (Atomic)
      await governance.auditTransaction(user.id, 'image')

      const { data: mediaRecord, error: insertError } = await serverClient
        .from('media')
        .insert({
          user_id: user.id,
          type: 'image',
          storage_url: publicUrl,
          analysis_data: analysisResult,
          is_watermarked: false,
        })
        .select('id')
        .single()

      if (insertError) {
        // Cleanup storage on DB failure
        await serverClient.storage
          .from('media-uploads')
          .remove([uniqueFileName])
        throw new Error(`Failed to save media record: ${insertError.message}`)
      }

      return {
        mediaId: mediaRecord.id,
        analysis: analysisResult,
        model: decision.model,
      }
    } catch (error: any) {
      // General cleanup for parallel failures
      console.error('[processMediaAnalysisFn] Fatal Error:', error)
      // Attempt to clean up storage if it might have succeeded
      await serverClient.storage
        .from('media-uploads')
        .remove([uniqueFileName])
        .catch(() => {})
      throw error
    }
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
    let result = ''
    let isSafetyBlock = false
    try {
      result = await getExplanation(
        data.context,
        data.question,
        profile,
        decision.model,
        data.history || [],
      )
    } catch (error: any) {
      if (
        error.message?.includes('SAFETY') ||
        error.message?.includes('blocked')
      ) {
        isSafetyBlock = true
        result =
          "I'm sorry, I cannot provide an explanation for this request as it falls outside our safety guidelines for educational content."
      } else {
        throw error
      }
    }

    // 3. Audit Cost (Async)
    const tokensIn = (data.context.length + data.question.length) / 4
    const tokensOut = result.length / 4
    await governance.auditTransaction(
      user.id,
      'text',
      tokensIn,
      tokensOut,
      isSafetyBlock,
      data.question,
    )

    return {
      result,
      model: decision.model,
    }
  })

export const getExplanationStreamFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (d: {
      context: string
      question: string
      history?: { role: string; text: string }[]
    }) => d,
  )
  .handler(async ({ data }) => {
    try {
      const { user, supabase } = await requireUser()
      const serverClient = getSupabaseServerClient()
      const governance = new AIGovernanceService(serverClient)

      let decision
      try {
        decision = await governance.routeRequest(user.id, 'text')
      } catch (error: any) {
        console.error('[Governance Error]:', error)
        return new Response(
          JSON.stringify({ error: 'Governance check failed' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } },
        )
      }

      if (!decision.canProceed) {
        if (decision.tier === 'black') {
          return new Response(
            'You have reached your learning limit for this month.',
            { status: 429 },
          )
        }
        return new Response('PAYMENT_REQUIRED', { status: 402 })
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      const { getExplanationStream } = await import('../services/gemini')
      const encoder = new TextEncoder()

      let generator: AsyncGenerator<string, any, any>

      try {
        generator = getExplanationStream(
          data.context,
          data.question,
          profile,
          decision.model,
          data.history || [],
        )
      } catch (initError: any) {
        console.error('[Generator Init Error]:', initError)
        const errorMessage = initError.message || JSON.stringify(initError)
        const isRateLimit =
          errorMessage.includes('429') || errorMessage.includes('QUOTA')
        const status = isRateLimit ? 429 : 500
        const body = isRateLimit
          ? 'Usage limit exceeded.'
          : 'Failed to start stream.'

        return new Response(JSON.stringify({ error: body }), {
          status,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      const stream = new ReadableStream({
        async start(controller) {
          try {
            let fullText = ''
            for await (const chunk of generator) {
              fullText += chunk
              controller.enqueue(encoder.encode(chunk))
            }
            try {
              const tokensIn = (data.context.length + data.question.length) / 4
              const tokensOut = fullText.length / 4
              await governance.auditTransaction(
                user.id,
                'text',
                tokensIn,
                tokensOut,
                false,
                data.question,
              )
            } catch (auditError) {
              console.error('[Audit Error]:', auditError)
            }
            controller.close()
          } catch (streamError: any) {
            const errorMessage =
              streamError.message || JSON.stringify(streamError)
            const isSafetyBlock =
              errorMessage.includes('SAFETY') ||
              errorMessage.includes('blocked')
            const isRateLimit =
              streamError.status === 429 ||
              errorMessage.includes('429') ||
              errorMessage.includes('QUOTA') ||
              errorMessage.includes('Too Many Requests')

            try {
              let errorMsg =
                '\n\nAn error occurred while generating the response.'
              if (isRateLimit) {
                errorMsg = '\n\nRate limit exceeded. Please wait a moment.'
              } else if (isSafetyBlock) {
                errorMsg =
                  '\n\n[Content blocked for safety/responsibility guidelines]'
                // Audit safety block if we have the user context
                try {
                  await governance.auditTransaction(
                    user.id,
                    'text',
                    0,
                    0,
                    true,
                    data.question,
                  )
                } catch {}
              }
              controller.enqueue(encoder.encode(errorMsg))
            } catch (e) {
            } finally {
              try {
                controller.close()
              } catch (e) {}
            }
          }
        },
        cancel(reason) {
          console.log('[Stream Cancelled]:', reason)
        },
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'X-Accel-Buffering': 'no',
          'X-Model-ID': decision.model,
        },
      })
    } catch (error: any) {
      console.error('[Handler Fatal Error]:', error)
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  })
