import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Search,
  Filter,
  ArrowRight,
  Globe,
  Atom,
  History,
  Palette,
  Star,
  Users
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { exploreWorldsFn } from '../services/learning-funcs'

export const Route = createFileRoute('/explore')({
  component: ExplorePage,
})

function ExplorePage() {
  const [worlds, setWorlds] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    exploreWorldsFn({ data: undefined }).then(data => {
      setWorlds(data)
      setIsLoading(false)
    })
  }, [])

  const categories = [
    { name: 'All', icon: Globe },
    { name: 'Science', icon: Atom },
    { name: 'History', icon: History },
    { name: 'Art', icon: Palette },
    { name: 'Business', icon: Star },
    { name: 'Engineering', icon: Filter },
    { name: 'Biology', icon: Users },
  ]

  const filteredWorlds = worlds.filter(world => {
    const matchesCategory = selectedCategory === 'All' || world.category === selectedCategory
    const matchesSearch = world.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      world.desc.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-zinc-200 border-t-zinc-950 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-8 lg:p-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h1 className="text-5xl font-display text-zinc-900 mb-4">Explore Worlds</h1>
          <p className="text-zinc-500">Discover interactive scenes from every corner of knowledge.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="text"
              placeholder="Search worlds..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-6 py-3 bg-zinc-50 border border-black/5 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all w-full md:w-64"
            />
          </div>
          <button className="p-3 bg-zinc-50 border border-black/5 rounded-2xl hover:bg-zinc-100 transition-colors">
            <Filter size={18} className="text-zinc-600" />
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-4 mb-12">
        {categories.map((cat) => (
          <button
            key={cat.name}
            onClick={() => setSelectedCategory(cat.name)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl border transition-all text-sm font-bold ${selectedCategory === cat.name
              ? 'bg-zinc-900 border-zinc-900 text-white shadow-lg shadow-zinc-200'
              : 'bg-zinc-50 border-black/5 text-zinc-600 hover:text-zinc-900 hover:border-black/10'
              }`}
          >
            <cat.icon size={16} />
            {cat.name}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredWorlds.map((world, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="group relative rounded-3xl overflow-hidden border border-black/5 bg-zinc-50/50 hover:bg-white hover:shadow-xl hover:shadow-black/5 transition-all cursor-pointer"
          >
            <div className="aspect-[4/3] bg-zinc-100 flex items-center justify-center overflow-hidden">
              {world.img && (world.img.startsWith('/') || world.img.startsWith('http')) ? (
                <img src={world.img} alt={world.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <Globe className="text-zinc-200" size={64} />
              )}
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{world.category}</span>
                <div className="flex items-center gap-1">
                  <Star size={12} className="text-zinc-950 fill-zinc-950" />
                  <span className="text-xs font-bold text-zinc-900">4.8</span>
                </div>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-4">{world.title}</h3>
              <div className="flex items-center justify-between pt-4 border-t border-black/5">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <Users size={14} />
                  <span className="text-xs font-medium">1.2k students</span>
                </div>
                <Link
                  to="/learn/$id"
                  params={{ id: world.id }}
                  className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center group-hover:scale-110 transition-transform"
                >
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
