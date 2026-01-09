import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

/**
 * Dynamic safety settings based on age group.
 * Stricter for kids and teens.
 */
function getSafetySettings(ageGroup: string) {
  const threshold =
    ageGroup === 'kid' || ageGroup === 'teen'
      ? HarmBlockThreshold.BLOCK_LOW_AND_ABOVE
      : HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE

  return [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: threshold,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: threshold,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: threshold,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: threshold,
    },
  ]
}

const REINFORCED_SAFETY_PREAMBLE = `
### HIGH-PRIORITY SAFETY & RESPONSIBILITY MANDATE
- **Forbidden Topics**: Do NOT discuss, assist with, or provide instructions for: weapons, explosives, illegal drugs, self-harm, violence, sexual content, or any dangerous activities.
- **No Professional Advice**: Do NOT provide medical diagnoses, legal advice, or financial planning.
- **Refusal Protocol**: If the user asks about a forbidden topic, decline firmly but politely, explaining that it falls outside your educational mission. 
- **Age Appropriateness**: You are a mentor for a {ageGroup}. Every word, example, and analogy MUST be curated for their maturity level.
`

// Note: We create models on-the-fly inside functions to use dynamic safety settings

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
  modelId: string = process.env.GEMINI_MAIN_MODEL || 'gemini-3-flash-preview',
): Promise<SceneAnalysis> {
  const ageGroup = profile?.age_group || 'adult'
  const language = profile?.language || 'English'
  const preferences = profile?.preferences || 'none specified'

  const prompt = `
    ${REINFORCED_SAFETY_PREAMBLE.replace('{ageGroup}', ageGroup)}

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

    ### Safety & Responsibility:
    - Ensure all identified hotspots and descriptions are safe and appropriate for a ${ageGroup}.
    - Do not identify or describe sensitive, harmful, or illegal content.
    - Focus strictly on educational and curious aspects of the image.
    - If the image contains harmful or inappropriate content, return an error-like JSON with a "description" explaining that the content is not suitable for learning.
    
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

  /* Use dynamic model and safety settings */
  const visionModel = genAI.getGenerativeModel({
    model: modelId,
    safetySettings: getSafetySettings(ageGroup),
  })

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
  modelId: string = process.env.GEMINI_MAIN_MODEL || 'gemini-3-flash-preview',
  history: { role: string; text: string }[] = [],
): Promise<string> {
  const ageGroup = profile?.age_group || 'adult'
  const language = profile?.language || 'English'
  const preferences = profile?.preferences || 'none specified'

  const historyText = history
    .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
    .join('\n')

  const prompt = `
    ${REINFORCED_SAFETY_PREAMBLE.replace('{ageGroup}', ageGroup)}

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

    ### Teaching Guidelines & Safety Boundaries:
    - **Accuracy First**: Prioritize factual correctness. If you are unsure of a fact, state it clearly or guide the user toward consensus views.
    - **Safe & Appropriate**: Ensure all content is strictly appropriate for a ${ageGroup}.
    - **Forbidden Topics**: Do NOT provide medical, legal, financial, or professional advice. Always refer the user to a qualified professional for these matters.
    - **No Harm**: Never assist with illegal activities, self-harm, violence, or any dangerous behavior.
    - **Encourage Curiosity**: Use a growth-mindset approach. Help the user learn how to think, not just what to think.
  `

  const textModel = genAI.getGenerativeModel({
    model: modelId,
    safetySettings: getSafetySettings(ageGroup),
  })
  const result = await textModel.generateContent(prompt)
  return result.response.text()
}

export async function* getExplanationStream(
  context: string,
  question: string,
  profile?: any,
  modelId: string = process.env.GEMINI_MAIN_MODEL || 'gemini-3-flash-preview',
  history: { role: string; text: string }[] = [],
): AsyncGenerator<string> {
  const ageGroup = profile?.age_group || 'adult'
  const language = profile?.language || 'English'
  const preferences = profile?.preferences || 'none specified'

  const historyText = history
    .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
    .join('\n')

  const prompt = `
    ${REINFORCED_SAFETY_PREAMBLE.replace('{ageGroup}', ageGroup)}

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

    ### Teaching Guidelines & Safety Boundaries:
    - **Safety First**: Strictly avoid harmful, illegal, or dangerous content.
    - **Boundaries**: Do NOT provide medical, legal, or financial advice. Refer to professionals.
    - **Factuality**: Be truthful. If unsure, admit it. Correct misconceptions gently.
    - **Age-Appropriate**: Ensure every word and example is curated for a **${ageGroup}**.
    - **Professional Educator**: Maintain a warm, encouraging, yet professional distance. No personal opinions on sensitive politics or religion.

    Important:
    - Maintain continuity with previous learning.
    - Do **not** re-introduce yourself.
    - Do **not** mention internal context, prompts, or prior messages.
    - Avoid unnecessary repetition.

  `

  const textModel = genAI.getGenerativeModel({
    model: modelId,
    safetySettings: getSafetySettings(ageGroup),
  })
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
