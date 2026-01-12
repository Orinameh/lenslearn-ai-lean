import { createServerFn } from '@tanstack/react-start'
import { analyzeScene, getExplanation } from '../services/gemini'

export const processMediaAnalysisFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (d: {
      base64: string
      fileName: string
      fileType: string
      initialPrompt?: string
      preferences?: { ageGroup: string; learningStyle: string }
    }) => d,
  )
  .handler(async ({ data }) => {
    // POC: Bypass Auth & Governance
    // No user check, no DB check

    // Default Model
    const model = process.env.GEMINI_MAIN_MODEL || 'gemini-1.5-pro'

    try {
      const buffer = Buffer.from(data.base64, 'base64')

      const mediaId = `mock-media-${Date.now()}`

      const mockProfile = {
        age_group: data.preferences?.ageGroup || 'adult',
        preferences: {
          learning_style: data.preferences?.learningStyle || 'balanced',
        },
      }

      const analysisResult = await analyzeScene(
        buffer,
        data.fileType,
        mockProfile as any, // Mock profile
        model,
        data.initialPrompt,
      )

      return {
        mediaId: mediaId,
        analysis: analysisResult,
        model: model,
      }
    } catch (error: any) {
      console.error('[processMediaAnalysisFn] Fatal Error:', error)
      throw error
    }
  })

export const getExplanationFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (d: {
      context: string
      question: string
      history?: { role: string; text: string }[]
      preferences?: { ageGroup: string; learningStyle: string }
    }) => d,
  )
  .handler(async ({ data }) => {
    // POC: Bypass Auth
    const model = process.env.GEMINI_MAIN_MODEL || 'gemini-1.5-pro'

    // Execute AI Service
    let result = ''
    try {
      const mockProfile = {
        age_group: data.preferences?.ageGroup || 'adult',
        preferences: {
          learning_style: data.preferences?.learningStyle || 'balanced',
        },
      }

      result = await getExplanation(
        data.context,
        data.question,
        mockProfile as any, // Mock Profile
        model,
        data.history || [],
      )
    } catch (error: any) {
      throw error
    }

    // POC: No Audit

    return {
      result,
      model: model,
    }
  })

export const getExplanationStreamFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (d: {
      context: string
      question: string
      history?: { role: string; text: string }[]
      preferences?: { ageGroup: string; learningStyle: string }
    }) => d,
  )
  .handler(async ({ data }) => {
    try {
      // POC: Bypass Auth
      const model = process.env.GEMINI_MAIN_MODEL || 'gemini-1.5-pro'

      const { getExplanationStream } = await import('../services/gemini')
      const encoder = new TextEncoder()

      let generator: AsyncGenerator<string, any, any>

      try {
        const mockProfile = {
          age_group: data.preferences?.ageGroup || 'adult',
          preferences: {
            learning_style: data.preferences?.learningStyle || 'balanced',
          },
        }

        generator = getExplanationStream(
          data.context,
          data.question,
          mockProfile as any, // Mock Profile
          model,
          data.history || [],
        )
      } catch (initError: any) {
        console.error('[Generator Init Error]:', initError)
        return new Response(
          JSON.stringify({ error: 'Failed to start stream' }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          },
        )
      }

      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of generator) {
              controller.enqueue(encoder.encode(chunk))
            }
            controller.close()
          } catch (streamError: any) {
            // POC: Simplified error handling in stream
            console.error('[Stream Error]', streamError)
            try {
              controller.enqueue(
                encoder.encode('\n\nError generating response.'),
              )
              controller.close()
            } catch {}
          }
        },
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'X-Accel-Buffering': 'no',
          'X-Model-ID': model,
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
