import { createServerFn } from '@tanstack/react-start'
import { requireUser } from './auth-helper'

export const exploreWorldsFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    // exploreWorldsFn remains public as it's shown on the home page/explore page
    // In a real app, this would fetch from a 'worlds' table.
    return [
      {
        id: 'renaissance-florence',
        title: 'Renaissance Florence',
        desc: 'Explore the cradle of the Renaissance through interactive AI scenes.',
        category: 'History',
        img: '/images/worlds/renaissance_florence.png',
        color: 'bg-orange-50',
        accent: 'text-orange-600',
      },
      {
        id: 'solar-system-vr',
        title: 'Solar System VR',
        desc: 'A planetary journey with real-time astronomical data and facts.',
        category: 'Science',
        img: '/images/worlds/solar_system.png',
        color: 'bg-blue-50',
        accent: 'text-blue-600',
      },
      {
        id: 'ancient-egypt',
        title: 'Ancient Egypt',
        desc: 'Walk through the Valley of the Kings and decode ancient hieroglyphs.',
        category: 'History',
        img: '/images/worlds/ancient_egypt.png',
        color: 'bg-yellow-50',
        accent: 'text-yellow-700',
      },
      {
        id: 'deep-ocean-trench',
        title: 'Deep Ocean Trench',
        desc: 'Discover the bioluminescent wonders of the unexplored deep sea.',
        category: 'Biology',
        img: '/images/worlds/deep_ocean.png',
        color: 'bg-indigo-50',
        accent: 'text-indigo-600',
      },
      {
        id: 'great-wall',
        title: 'The Great Wall',
        desc: "A structural and historical analysis of the world's longest wall.",
        category: 'Engineering',
        img: '/images/worlds/great_wall.png',
        color: 'bg-emerald-50',
        accent: 'text-emerald-700',
      },
      {
        id: 'neuroscience-101',
        title: 'Neuroscience 101',
        desc: 'Interactive 3D maps of the human brain and neural pathways.',
        category: 'Science',
        img: '/images/worlds/neuroscience.png',
        color: 'bg-purple-50',
        accent: 'text-purple-600',
      },
      {
        id: 'startup-ecosystem',
        title: 'Startup Ecosystem',
        desc: 'Learn how to build and scale a tech company from the ground up.',
        category: 'Business',
        img: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&q=80&w=800',
        color: 'bg-cyan-50',
        accent: 'text-cyan-600',
      },
      {
        id: 'global-economics',
        title: 'Global Economics',
        desc: 'Master the principles of markets, trade, and financial systems.',
        category: 'Economics',
        img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800',
        color: 'bg-rose-50',
        accent: 'text-rose-600',
      },
      {
        id: 'modern-politics',
        title: 'Modern Politics',
        desc: 'Analyze global governance, diplomacy, and political ideologies.',
        category: 'Politics',
        img: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&q=80&w=800',
        color: 'bg-slate-50',
        accent: 'text-slate-600',
      },
      {
        id: 'career-navigator',
        title: 'Career Navigator',
        desc: 'Discover your path and master the skills for the modern workforce.',
        category: 'Career',
        img: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800',
        color: 'bg-lime-50',
        accent: 'text-lime-600',
      },
    ]
  },
)

export const getLearningSessionFn = createServerFn({ method: 'GET' })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const { user, supabase } = await requireUser()

    const { data: session, error } = await supabase
      .from('learning_sessions')
      .select('*')
      .eq('id', data.id)
      .eq('user_id', user.id)
      .single()

    if (error) throw new Error(error.message)
    return session
  })

export const getLatestSessionFn = createServerFn({ method: 'GET' })
  .inputValidator((d: { world?: string; mediaId?: string }) => d)
  .handler(async ({ data }) => {
    const { user, supabase } = await requireUser()

    let query = supabase
      .from('learning_sessions')
      .select('*')
      .eq('user_id', user.id)

    if (data.world) {
      query = query.eq('world', data.world)
    }
    if (data.mediaId) {
      query = query.eq('media_id', data.mediaId)
    }

    const { data: session, error } = await query
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw new Error(error.message)
    return session
  })

export const createLearningSessionFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (d: {
      entry_point: 'explore' | 'upload' | 'daily'
      world?: string
      media_id?: string
      title?: string
    }) => d,
  )
  .handler(async ({ data }) => {
    const { user, supabase } = await requireUser()

    const { data: session, error } = await supabase
      .from('learning_sessions')
      .insert({
        user_id: user.id,
        entry_point: data.entry_point,
        world: data.world,
        media_id: data.media_id,
        title: data.title,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return session
  })

export const saveMessageFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (d: { sessionId: string; role: 'user' | 'assistant'; text: string }) => d,
  )
  .handler(async ({ data }) => {
    const { user, supabase } = await requireUser()

    // 1. Fetch current messages
    const { data: session, error: fetchError } = await supabase
      .from('learning_sessions')
      .select('messages')
      .eq('id', data.sessionId)
      .eq('user_id', user.id)
      .single()

    if (fetchError) throw new Error(fetchError.message)

    const currentMessages = Array.isArray(session.messages)
      ? session.messages
      : []
    const newMessage = {
      role: data.role,
      text: data.text,
      created_at: new Date().toISOString(),
    }

    // 2. Update with appended message
    const { error: updateError } = await supabase
      .from('learning_sessions')
      .update({
        messages: [...currentMessages, newMessage],
      })
      .eq('id', data.sessionId)
      .eq('user_id', user.id)

    if (updateError) throw new Error(updateError.message)
    return { success: true }
  })

export const getSessionMessagesFn = createServerFn({ method: 'GET' })
  .inputValidator((d: { sessionId: string }) => d)
  .handler(async ({ data }) => {
    const { user, supabase } = await requireUser()

    const { data: session, error } = await supabase
      .from('learning_sessions')
      .select('messages')
      .eq('id', data.sessionId)
      .eq('user_id', user.id)
      .single()

    if (error) throw new Error(error.message)
    return session.messages || []
  })

export const getUserSessionsFn = createServerFn({ method: 'GET' })
  .inputValidator((d: { limit?: number; offset?: number } | undefined) => d)
  .handler(async ({ data }) => {
    const { user, supabase } = await requireUser()
    const limit = data?.limit ?? 10
    const offset = data?.offset ?? 0

    const { data: sessions, error } = await supabase
      .from('learning_sessions')
      .select('*, media:media_id(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw new Error(error.message)
    return sessions
  })

export const getHistoryCountFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { user, supabase } = await requireUser()

    const { count, error } = await supabase
      .from('learning_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (error) throw new Error(error.message)
    return count || 0
  },
)
