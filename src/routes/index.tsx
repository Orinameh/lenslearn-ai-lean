import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  Plus,
  ArrowRight,
  Atom,
  History,
  Palette,
  Users
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '../services/authStore'
import { exploreWorldsFn } from '../services/learning-funcs'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const [input, setInput] = useState('')
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const quickActions = [
    { label: 'Explore Science', icon: Atom, color: 'text-blue-500', action: () => navigate({ to: '/explore' }) },
    { label: 'Upload Image', icon: Plus, color: 'text-zinc-900', action: () => navigate({ to: '/upload' }) },
    { label: 'History Tour', icon: History, color: 'text-orange-500', action: () => setInput('Take me on a tour of Ancient Rome') },
    { label: 'Art Analysis', icon: Palette, color: 'text-purple-500', action: () => setInput('Analyze the composition of The Starry Night') },
  ]

  const handleSubmit = () => {
    if (!input.trim()) return
    if (!user) {
      navigate({ to: '/login', search: { redirect: '/' } })
      return
    }
    const id = input.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
    navigate({ to: '/learn/$id', params: { id } })
  }

  const [featuredWorlds, setFeaturedWorlds] = useState<any[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    exploreWorldsFn({ data: undefined }).then(worlds => {
      setFeaturedWorlds(worlds)
    })
  }, [])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [input])

  return (
    <div className="min-h-[calc(100vh-64px)] bg-white flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full max-w-4xl px-6 pt-32 pb-20 flex flex-col items-center text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-6xl md:text-7xl font-display text-zinc-900 mb-12"
        >
          What can I learn for you?
        </motion.h1>

        {/* Action Bar (Manus Style) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-2xl relative"
        >
          <div className="action-bar p-2 flex flex-col gap-2">
            <div className="flex items-start gap-3 px-4 py-3">
              <Plus size={20} className="text-zinc-400 mt-1 cursor-pointer hover:text-zinc-900 transition-colors" />
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit()
                  }
                }}
                placeholder="Assign a task or explore your curiosity"
                className="flex-1 bg-transparent border-none outline-none resize-none pt-0.5 text-zinc-900 text-[17px] leading-relaxed placeholder:text-zinc-300 min-h-[48px] max-h-[200px]"
              />
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-md bg-zinc-100 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-zinc-400">G</span>
                </div>
                <button
                  onClick={handleSubmit}
                  className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400 hover:bg-zinc-950 hover:text-white transition-all"
                >
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={action.action}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-black/5 hover:border-black/10 hover:bg-zinc-50 transition-all text-sm font-medium text-zinc-600"
              >
                <action.icon size={16} className={action.color} />
                {action.label}
              </button>
            ))}
            <Link to="/explore" className="text-sm font-medium text-zinc-400 hover:text-zinc-900 px-4 py-2 underline decoration-zinc-200 underline-offset-4">More</Link>
          </div>
        </motion.div>
      </section>

      {/* Grid Section */}
      <section className="w-full max-w-6xl px-6 pb-32">
        <div className="flex items-center justify-between mb-10">
          <h3 className="text-sm font-bold text-zinc-950 uppercase tracking-widest">Recommended Worlds</h3>
          <Link to="/explore" className="text-xs font-bold text-zinc-400 hover:text-zinc-900 flex items-center gap-1 transition-colors">
            VIEW ALL <ArrowRight size={12} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredWorlds.map((world, i) => (
            <motion.div
              key={world.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              className={`group p-1 rounded-[32px] transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${world.color}`}
              onClick={() => navigate({ to: '/learn/$id', params: { id: world.id } })}
            >
              <div className="bg-white rounded-[28px] p-6 h-full border border-black/[0.03] shadow-sm group-hover:shadow-xl group-hover:shadow-black/[0.02] transition-all flex flex-col">
                <div className="flex items-start justify-between mb-6">
                  <div className={`w-14 h-14 rounded-2xl ${world.color} flex items-center justify-center overflow-hidden shadow-inner`}>
                    {world.img.startsWith('/') || world.img.startsWith('http') ? (
                      <img src={world.img} alt={world.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl">{world.img}</span>
                    )}
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${world.accent}`}>{world.category}</span>
                  </div>
                </div>

                <h4 className="text-xl font-bold text-zinc-900 mb-2 leading-tight group-hover:text-black transition-colors">{world.title}</h4>
                <p className="text-sm text-zinc-500 leading-relaxed mb-8 flex-1">{world.desc}</p>

                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2 items-center">
                    {[1, 2, 3].map(n => (
                      <div key={n} className="w-6 h-6 rounded-full border-2 border-white bg-zinc-100 flex items-center justify-center text-[8px] font-bold text-zinc-400 overflow-hidden">
                        <Users size={10} />
                      </div>
                    ))}
                    <div className="pl-4 text-[10px] font-bold text-zinc-400">1.2k exploring</div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-950 group-hover:text-white transition-all">
                    <ArrowRight size={16} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  )
}
