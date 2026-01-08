import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
    ArrowLeft,
    ArrowRight,
    Atom,
    Clock,
    History as HistoryIcon,
    Palette,
    Search
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useAuthStore } from '../services/authStore'
import { getUserSessionsFn, getHistoryCountFn } from '../services/learning-funcs'
import { authGuard } from '../services/authMiddleware'

export const Route = createFileRoute('/history')({
    beforeLoad: authGuard,
    component: HistoryPage,
})

function HistoryPage() {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const [sessions, setSessions] = useState<any[]>([])
    const [count, setCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(0)
    const limit = 12

    useEffect(() => {
        if (!user) return

        setLoading(true)
        Promise.all([
            getUserSessionsFn({ data: { limit, offset: page * limit } }),
            getHistoryCountFn({ data: undefined })
        ]).then(([sessionsData, countData]) => {
            setSessions(sessionsData || [])
            setCount(countData || 0)
        }).catch(err => {
            console.error("Failed to fetch history:", err)
        }).finally(() => {
            setLoading(false)
        })
    }, [user, page])

    const filteredSessions = sessions.filter(s =>
        s.title?.toLowerCase().includes(search.toLowerCase()) ||
        (s.media?.analysis_data?.title || '').toLowerCase().includes(search.toLowerCase())
    )

    const totalPages = Math.ceil(count / limit)

    return (
        <div className="min-h-[calc(100vh-64px)] bg-zinc-50 flex flex-col items-center">
            <div className="w-full max-w-6xl px-6 py-12">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <Link to="/" className="text-zinc-400 hover:text-zinc-900 flex items-center gap-2 text-sm font-bold mb-4 transition-colors">
                            <ArrowLeft size={16} /> BACK HOME
                        </Link>
                        <h1 className="text-4xl font-display text-zinc-900 flex items-center gap-3">
                            <HistoryIcon size={32} className="text-orange-500" />
                            Learning History
                        </h1>
                    </div>

                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
                        <input
                            type="text"
                            placeholder="Search your sessions..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white border border-black/5 shadow-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all text-sm"
                        />
                    </div>
                </header>

                {/* Sessions Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-40">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-40 rounded-[24px] bg-white animate-pulse" />
                        ))}
                    </div>
                ) : filteredSessions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredSessions.map((session, i) => (
                            <motion.div
                                key={session.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => navigate({
                                    to: '/learn/$id',
                                    params: { id: session.media_id || session.world || 'session' },
                                    search: {
                                        type: session.media_id ? 'image' : 'text',
                                        session: session.id
                                    }
                                })}
                                className="group p-1 rounded-[24px] bg-white border border-black/5 hover:border-black/10 hover:shadow-xl hover:shadow-black/[0.02] transition-all cursor-pointer flex flex-col"
                            >
                                <div className="p-5 flex flex-col h-full">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-black/5 flex items-center justify-center">
                                            {session.media_id ? (
                                                <Palette size={18} className="text-purple-500" />
                                            ) : (
                                                <Atom size={18} className="text-blue-500" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 truncate">
                                                {session.media_id ? 'AI Analysis' : 'Guided Exploration'}
                                            </p>
                                            <div className="flex items-center gap-1.5 text-[10px] text-zinc-300 font-bold">
                                                <Clock size={10} />
                                                {new Date(session.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                    <h4 className="text-[17px] font-bold text-zinc-900 group-hover:text-black leading-tight line-clamp-2 flex-1">
                                        {session.title || 'Untitled Session'}
                                    </h4>
                                    <div className="mt-4 flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-zinc-400 group-hover:text-zinc-600 transition-colors uppercase tracking-widest">RESUME LEARNING</span>
                                        <ArrowRight size={14} className="text-zinc-300 group-hover:text-zinc-900 transition-colors" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="py-20 flex flex-col items-center text-center">
                        <div className="w-20 h-20 rounded-full bg-white border border-black/5 flex items-center justify-center mb-6">
                            <Search size={32} className="text-zinc-200" />
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 mb-2">No results found</h3>
                        <p className="text-zinc-500 max-w-sm">
                            We couldn't find any sessions matching your search. Try a different term or start a new curiosity quest!
                        </p>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && !loading && (
                    <div className="mt-16 flex items-center justify-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="w-10 h-10 rounded-xl bg-white border border-black/5 flex items-center justify-center text-zinc-400 hover:text-zinc-950 disabled:opacity-30 transition-all font-bold"
                        >
                            <ArrowLeft size={16} />
                        </button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setPage(i)}
                                    className={`w-10 h-10 rounded-xl text-sm font-black transition-all ${page === i
                                            ? 'bg-zinc-900 text-white shadow-lg shadow-black/10'
                                            : 'bg-white border border-black/5 text-zinc-400 hover:text-zinc-900'
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={page === totalPages - 1}
                            className="w-10 h-10 rounded-xl bg-white border border-black/5 flex items-center justify-center text-zinc-400 hover:text-zinc-950 disabled:opacity-30 transition-all font-bold"
                        >
                            <ArrowRight size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
