import { createServerFn } from '@tanstack/react-start'
import { requireUser } from './auth-helper'

export const exploreWorldsFn = createServerFn({ method: "GET" })
  .handler(async () => {
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
        accent: 'text-orange-600'
      },
      {
        id: 'solar-system-vr',
        title: 'Solar System VR',
        desc: 'A planetary journey with real-time astronomical data and facts.',
        category: 'Science',
        img: '/images/worlds/solar_system.png',
        color: 'bg-blue-50',
        accent: 'text-blue-600'
      },
      {
        id: 'ancient-egypt',
        title: 'Ancient Egypt',
        desc: 'Walk through the Valley of the Kings and decode ancient hieroglyphs.',
        category: 'History',
        img: '/images/worlds/ancient_egypt.png',
        color: 'bg-yellow-50',
        accent: 'text-yellow-700'
      },
      {
        id: 'deep-ocean-trench',
        title: 'Deep Ocean Trench',
        desc: 'Discover the bioluminescent wonders of the unexplored deep sea.',
        category: 'Biology',
        img: '/images/worlds/deep_ocean.png',
        color: 'bg-indigo-50',
        accent: 'text-indigo-600'
      },
      {
        id: 'great-wall',
        title: 'The Great Wall',
        desc: 'A structural and historical analysis of the world\'s longest wall.',
        category: 'Engineering',
        img: '/images/worlds/great_wall.png',
        color: 'bg-emerald-50',
        accent: 'text-emerald-700'
      },
      {
        id: 'neuroscience-101',
        title: 'Neuroscience 101',
        desc: 'Interactive 3D maps of the human brain and neural pathways.',
        category: 'Science',
        img: '/images/worlds/neuroscience.png',
        color: 'bg-purple-50',
        accent: 'text-purple-600'
      },
      {
        id: 'startup-ecosystem',
        title: 'Startup Ecosystem',
        desc: 'Learn how to build and scale a tech company from the ground up.',
        category: 'Business',
        img: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&q=80&w=800',
        color: 'bg-cyan-50',
        accent: 'text-cyan-600'
      },
      {
        id: 'global-economics',
        title: 'Global Economics',
        desc: 'Master the principles of markets, trade, and financial systems.',
        category: 'Economics',
        img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800',
        color: 'bg-rose-50',
        accent: 'text-rose-600'
      },
      {
        id: 'modern-politics',
        title: 'Modern Politics',
        desc: 'Analyze global governance, diplomacy, and political ideologies.',
        category: 'Politics',
        img: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&q=80&w=800',
        color: 'bg-slate-50',
        accent: 'text-slate-600'
      },
      {
        id: 'career-navigator',
        title: 'Career Navigator',
        desc: 'Discover your path and master the skills for the modern workforce.',
        category: 'Career',
        img: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800',
        color: 'bg-lime-50',
        accent: 'text-lime-600'
      }
    ]
  })

export const getLearningSessionFn = createServerFn({ method: "GET" })
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

export const createLearningSessionFn = createServerFn({ method: "POST" })
  .inputValidator((d: { 
    entry_point: 'explore' | 'upload' | 'daily'; 
    world: string 
  }) => d)
  .handler(async ({ data }) => {
    const { user, supabase } = await requireUser()

    const { data: session, error } = await supabase
      .from('learning_sessions')
      .insert({
        user_id: user.id,
        entry_point: data.entry_point,
        world: data.world,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return session
  })
