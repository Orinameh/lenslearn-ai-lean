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
    Return the response in valid JSON format matching the SceneAnalysis interface.
  `

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

  // Basic JSON extraction (should be more robust in production)
  const jsonStart = text.indexOf('{')
  const jsonEnd = text.lastIndexOf('}') + 1
  const jsonStr = text.slice(jsonStart, jsonEnd)

  return JSON.parse(jsonStr) as SceneAnalysis
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
