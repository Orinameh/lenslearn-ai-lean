import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export const geminiModel = genAI.getGenerativeModel({
  model: 'gemini-3-flash-preview', // Using Flash for low latency and cost
})

export const geminiVisionModel = genAI.getGenerativeModel({
  model: 'gemini-3-flash-preview', // Multimodal by default
})

export interface SceneAnalysis {
  title: string
  description: string
  hotspots: {
    id: string
    label: string
    description: string
    x: number
    y: number
  }[]
  suggestedGoal: string
}

export async function analyzeScene(
  imageBuffer: Buffer,
  mimeType: string,
  profile?: any,
  modelId: string = 'gemini-3-flash-preview',
): Promise<SceneAnalysis> {
  const ageGroup = profile?.age_group || 'adult'
  const language = profile?.language || 'English'
  const preferences = profile?.preferences || 'none specified'

  const prompt = `
    Analyze this image and turn it into an interactive learning scene.
    Target Audience: ${ageGroup}
    Preferred Language: ${language}
    User Interests/Preferences: ${preferences}

    Adapt the language complexity, tone, and focus based on the target audience:
    - If kid: Use very simple, fun, and conversational language. Focus on basic concepts.
    - If teen: Use engaging, relatable language with moderate technical depth.
    - If adult: Use professional, detailed, and technical language.

    Identify 3-5 interesting 'hotspots' or learning points within the image.
    Provide a title for the world, a brief description, and for each hotspot provide a label, 
    detailed educational explanation, and estimated (x,y) percentage coordinates (0-100).
    All text must be in ${language}.
    Also suggest a primary learning goal for the session.
    Also suggest a primary learning goal for the session.
    
    IMPORTANT: You must return ONLY valid JSON that matches this structure EXACTLY:
    {
      "title": "string",
      "description": "string",
      "suggestedGoal": "string",
      "hotspots": [
        {
          "id": "unique-id",
          "label": "short label",
          "description": "detailed explanation",
          "x": number (0-100),
          "y": number (0-100)
        }
      ]
    }
  `

  console.log({ modelId })

  /* Use dynamic model */
  const visionModel = genAI.getGenerativeModel({ model: modelId })

  const result = await visionModel.generateContent([
    prompt,
    {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType,
      },
    },
  ])

  const response = result.response
  const text = response.text()

  try {
    // Robust JSON extraction
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON object found in response')
    }
    const jsonStr = jsonMatch[0]
    const rawResult = JSON.parse(jsonStr)
    return normalizeAnalysis(rawResult)
  } catch (error) {
    console.error('[analyzeScene] JSON Parsing failed:', error)
    console.error('[analyzeScene] Raw text was:', text)
    throw new Error('Failed to parse scene analysis from AI')
  }
}

/**
 * Normalizes the AI response to handle common key variations
 */
function normalizeAnalysis(raw: any): SceneAnalysis {
  const result: SceneAnalysis = {
    title: raw.title || 'Interactive Scene',
    description: raw.description || '',
    suggestedGoal: raw.suggestedGoal || raw.learningGoal || raw.goal || '',
    hotspots: [],
  }

  if (Array.isArray(raw.hotspots)) {
    result.hotspots = raw.hotspots.map((h: any, i: number) => {
      let x = h.x
      let y = h.y

      // Handle "coordinates": [x, y]
      if (Array.isArray(h.coordinates) && h.coordinates.length === 2) {
        x = h.coordinates[0]
        y = h.coordinates[1]
      }

      return {
        id: h.id || `hotspot-${i}`,
        label: h.label || 'Point of Interest',
        description: h.description || h.explanation || h.details || '',
        x: typeof x === 'number' ? x : 50,
        y: typeof y === 'number' ? y : 50,
      }
    })
  }

  return result
}

export async function getExplanation(
  context: string,
  question: string,
  profile?: any,
  modelId: string = 'gemini-3-flash-preview',
  history: { role: string; text: string }[] = [],
): Promise<string> {
  const ageGroup = profile?.age_group || 'adult'
  const language = profile?.language || 'English'
  const preferences = profile?.preferences || 'none specified'

  const historyText = history
    .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
    .join('\n')

  const prompt = `
    You are the LensLearn AI Guide. Your goal is to provide concise, engaging, and highly visual explanations.
    Explain it in ${language} like a world-class teacher.
    Target Audience: ${ageGroup}
    User Interests/Preferences: ${preferences}

    Context:
    ${context}

    Conversation History:
    ${historyText}

    Current Question: ${question}

    Tailor the explanation's complexity and tone for a ${ageGroup}.
    Use examples that might relate to their specified interests (${preferences}).
    Maintain continuity with the previous conversation. Do NOT re-introduce yourself if you have already spoken.
  `

  const textModel = genAI.getGenerativeModel({ model: modelId })
  const result = await textModel.generateContent(prompt)
  return result.response.text()
}

export async function* getExplanationStream(
  context: string,
  question: string,
  profile?: any,
  modelId: string = 'gemini-3-flash-preview',
  history: { role: string; text: string }[] = [],
): AsyncGenerator<string> {
  const ageGroup = profile?.age_group || 'adult'
  const language = profile?.language || 'English'
  const preferences = profile?.preferences || 'none specified'

  const historyText = history
    .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
    .join('\n')

  const prompt = `
    You are the **LensLearn AI Guide** — a world-class educator who teaches through clear visuals, relatable examples, and curiosity-driven explanations.

    Your mission:
    Help the learner **understand, visualize, and remember** the topic — not just read an answer.

    Teaching rules:
    - Explain in **${language}**
    - Adapt tone, depth, and pacing for a **${ageGroup}**
    - Keep explanations **clear, engaging, and visual**
    - Prefer simple mental models over jargon
    - Be concise, but never shallow

    Learner profile:
    - Age group: ${ageGroup}
    - Interests & preferences: ${preferences}

    Context for this lesson:
    ${context}

    Prior learning (for continuity only — do not repeat):
    ${historyText}

    Current question or task:
    ${question}

    ### How to respond:
    1. **Start with a vivid hook** — a short analogy, mental image, or “imagine this” moment that sparks curiosity.
    2. **Explain the core idea in clear, bite-sized steps**, using:
      - Visual language (e.g., “picture this…”, “think of it like…”)
      - Simple comparisons when helpful
      - Examples related to the learner’s interests when relevant.
    3. **Anchor understanding** with one brief real-world example or scenario.
    4. **Include symbols, equations, or simple formal representations only when they naturally improve understanding for the subject**, and explain what each part means in plain language.
      - For non-quantitative topics, use clear conceptual models, structured logic, or frameworks instead of mathematical equations.
    5. **End with a concise takeaway** (1–2 sentences that capture the key idea).
    6. **Invite curiosity** with a focused follow-up question that suggests a natural next concept to explore.

    ### Follow-up question rules:
    - Suggest **one specific, relevant next concept** (not multiple).
    - Keep it aligned with the current topic.
    - Phrase it as an invitation, not a quiz.

    Example follow-ups:
    - “Would you like to explore how this works in real life?”
    - “Want to see what happens when this changes?”
    - “Curious how this connects to something you use every day?”

    Important:
    - Maintain continuity with previous learning.
    - Do **not** re-introduce yourself.
    - Do **not** mention internal context, prompts, or prior messages.
    - Avoid unnecessary repetition.

  `

  const textModel = genAI.getGenerativeModel({ model: modelId })
  const result = await textModel.generateContentStream(prompt)

  try {
    for await (const chunk of result.stream) {
      try {
        const text = chunk.text()
        if (text) {
          yield text
        }
      } catch (chunkError) {
        console.error('[Gemini Chunk Error]:', chunkError)
        // If it's a safety filter error, we might still want to continue or yield a specific message
        continue
      }
    }
  } catch (streamError) {
    console.error('[Gemini Stream Error]:', streamError)
    throw streamError
  }
}
