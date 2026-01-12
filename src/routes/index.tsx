import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  ArrowRight,
  Atom,
  History,
  Palette,
  Users,
  Camera,
  Sparkles,
  Scan,
  Loader2,
  X,
  FileText,
  Image as ImageIcon,
  BrainCircuit
} from 'lucide-react'
import { PreferencesBar } from '../components/PreferencesBar'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { exploreWorldsFn, } from '../services/learning-funcs'
import { processMediaAnalysisFn } from '../services/server-funcs'
import toast from 'react-hot-toast'
import { seo } from 'utils/seo'

export const Route = createFileRoute('/')({
  component: App,
  head: () => ({
    meta: seo({
      title: 'LensLearn - Interactive Visual Learning & AI Tutor',
      description: 'Unlock a new way of learning with LensLearn. Upload images, explore AI-generated worlds, and get instant educational explanations from our advanced AI tutor. Visual learning for all ages.',
      keywords: 'Visual Learning, AI Tutor, Image Analysis, Interactive Education, Educational AI, LensLearn',
    }),
  }),
})

function App() {
  const [input, setInput] = useState('')
  const navigate = useNavigate()


  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [cyclingWordIndex, setCyclingWordIndex] = useState(0)
  const words = ['see', 'ask']

  useEffect(() => {
    const timer = setInterval(() => {
      setCyclingWordIndex((prev) => (prev + 1) % words.length)
    }, 3500)
    return () => clearInterval(timer)
  }, [])

  const handleLensClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Basic validation
    const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    const MAX_FILE_SIZE = 500 * 1024

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Only PNG, JPEG, JPG, and WebP images are allowed')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size must be less than 500KB')
      return
    }

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    // Clear text if we are switching to image focus? 
    // Actually let's keep it as "context"
  }

  const removeFile = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async () => {

    if (selectedFile) {
      setIsAnalyzing(true)
      try {
        const reader = new FileReader()
        reader.readAsDataURL(selectedFile)
        reader.onload = async () => {
          try {
            const base64 = (reader.result as string).split(',')[1]
            // import { currentSessionStore } from '../utils/store'

            const { userPreferencesStore } = await import('../store')
            const prefs = userPreferencesStore.get()

            const { mediaId, analysis } = await processMediaAnalysisFn({
              data: {
                fileName: selectedFile.name,
                fileType: selectedFile.type,
                base64: base64,
                initialPrompt: input,
                preferences: prefs
              }
            })

            // Store transient data for the next route
            if (previewUrl) {
              // We use the simpler method of module-level store because state in navigate is tricky with serialization
              const { currentSessionStore } = await import('../store')
              currentSessionStore.set({
                id: mediaId,
                imageUrl: previewUrl,
                analysis: analysis
              })
            }

            toast.success("Scene generated successfully!")
            navigate({
              to: '/learn/$id',
              params: { id: mediaId },
              search: { type: 'image' }
            })
          } catch (error: any) {
            console.error("Analysis failed", error)
            toast.error(error.message || "Failed to process image")
          } finally {
            setIsAnalyzing(false)
          }
        }
      } catch (error: any) {
        toast.error("Failed to read image")
        setIsAnalyzing(false)
      }
    } else {
      if (!input.trim()) return
      const id = input.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
      navigate({ to: '/learn/$id', params: { id }, search: { type: 'text' } })
    }
  }

  const [featuredWorlds, setFeaturedWorlds] = useState<any[]>([])
  const [recentSessions] = useState<any[]>([])
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
      <section className="w-full max-w-5xl px-6 pt-20 pb-20 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 font-display text-zinc-400 text-lg md:text-xl flex items-center gap-3"
        >
          <Sparkles size={20} className="text-zinc-900" />
          LensLearn — Advanced AI Universal Intelligence
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-6xl md:text-8xl font-display text-zinc-900 mb-16 tracking-tight flex flex-wrap items-center justify-center gap-x-[0.2em]"
        >
          <span>Learn from what you</span>
          <span className="relative inline-block h-[1.1em] min-w-[3ch] overflow-hidden align-bottom">
            <AnimatePresence mode="wait">
              <motion.span
                key={words[cyclingWordIndex]}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40 }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                className="absolute inset-0 flex items-center justify-center"
              >
                {words[cyclingWordIndex]}
              </motion.span>
            </AnimatePresence>
          </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">with AI.</span>
        </motion.h1>

        {/* The Hub - Unified Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-3xl flex flex-col gap-4"
        >
          <div
            className={`hub-container group p-2 rounded-[32px] bg-white border border-black/5 shadow-2xl shadow-black/[0.04] transition-all duration-500 hover:border-zinc-200 focus-within:border-zinc-900 focus-within:ring-4 focus-within:ring-zinc-900/5 ${isAnalyzing ? 'opacity-50 pointer-events-none' : ''}`}
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-zinc-900', 'bg-zinc-50/50') }}
            onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-zinc-900', 'bg-zinc-50/50') }}
            onDrop={(e) => {
              e.preventDefault()
              e.currentTarget.classList.remove('border-zinc-900', 'bg-zinc-50/50')
              const file = e.dataTransfer.files?.[0]
              if (file) {
                handleFileChange({ target: { files: [file] } } as any)
              }
            }}
          >
            <div className="flex flex-col gap-3 p-2">
              <AnimatePresence>
                {previewUrl && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, scale: 0.9 }}
                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.9 }}
                    className="px-2 pt-2 mb-1"
                  >
                    <div className="relative inline-block group/preview">
                      <div className="w-32 h-24 rounded-2xl overflow-hidden border border-black/5 bg-zinc-50 shadow-inner">
                        <img src={previewUrl} className="w-full h-full object-cover" />
                      </div>
                      <button
                        onClick={removeFile}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center shadow-lg hover:bg-zinc-800 transition-colors"
                      >
                        <X size={14} />
                      </button>
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center rounded-2xl pointer-events-none">
                        < ImageIcon size={16} className="text-white" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={handleLensClick}
                  className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm border border-black/5 ${previewUrl ? 'bg-zinc-900 text-white' : 'bg-zinc-50 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 hover:scale-105 active:scale-95'}`}
                  title="Upload Image (Lens)"
                >
                  <Camera size={24} />
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </button>

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
                  placeholder={previewUrl ? "Add context to your image..." : "Learn what you see. Drop an image or ask a question..."}
                  className="flex-1 bg-transparent border-none outline-none resize-none pt-2.5 text-zinc-900 text-[17px] leading-relaxed placeholder:text-zinc-300 min-h-[48px] max-h-[200px]"
                />

                <div className="flex items-center self-end pb-1 pr-1">
                  <button
                    onClick={handleSubmit}
                    disabled={(!input.trim() && !selectedFile) || isAnalyzing}
                    className={`h-10 rounded-xl bg-zinc-950 text-white flex items-center justify-center gap-2 transition-all shadow-lg hover:scale-[1.02] active:scale-95 disabled:opacity-20 disabled:grayscale disabled:scale-100 disabled:cursor-not-allowed ${selectedFile ? 'px-6' : 'w-10'}`}
                  >
                    {isAnalyzing ? (
                      <>
                        <span className="text-sm font-bold">Analyzing...</span>
                        <Loader2 className="animate-spin" size={18} />
                      </>
                    ) : selectedFile ? (
                      <>
                        <span className="text-sm font-bold whitespace-nowrap">Analyze Image</span>
                        <BrainCircuit size={18} />
                      </>
                    ) : (
                      <ArrowRight size={20} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center w-full -mt-2 mb-2">
            <PreferencesBar />
          </div>

          <div className="flex items-center justify-center gap-6 px-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300 flex items-center gap-2">
              <Scan size={12} />
              Visual Analysis
            </p>
            <div className="w-1 h-1 rounded-full bg-zinc-200" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300 flex items-center gap-2">
              <FileText size={12} />
              Guided Tutoring
            </p>
          </div>
        </motion.div>
      </section>

      {/* Recent Learning Section */}
      {
        recentSessions.length > 0 && (
          <section className="w-full max-w-6xl px-6 mb-20">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-bold text-zinc-950 uppercase tracking-widest flex items-center gap-2">
                <History size={16} className="text-orange-500" />
                Recent Learning
              </h3>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 no-scrollbar">
              {recentSessions.map((session, i) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => navigate({
                    to: '/learn/$id',
                    params: { id: session.media_id || session.world || 'session' },
                    search: {
                      type: session.media_id ? 'image' : 'text',
                      session: session.id
                    }
                  })}
                  className="shrink-0 w-72 p-1 rounded-[24px] bg-zinc-50 border border-black/[0.03] hover:border-black/10 hover:bg-white hover:shadow-xl hover:shadow-black/[0.02] transition-all cursor-pointer group"
                >
                  <div className="p-5 flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-black/5 flex items-center justify-center">
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
                        <p className="text-[10px] text-zinc-300 font-bold">
                          {new Date(session.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <h4 className="text-sm font-bold text-zinc-900 group-hover:text-black line-clamp-1">
                      {session.title || 'Untitled Session'}
                    </h4>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )
      }

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
                      <img src={world.img} alt={`Learning World: ${world.title}`} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl" role="img" aria-label={world.title}>{world.img}</span>
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

      {/* Footer */}
      <footer className="w-full border-t border-black/[0.03] py-8 mt-auto bg-white/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 flex flex-col items-center justify-center gap-4">
          {/* Line Separator is handled by border-t above, but we can add a visual divider if needed. The screenshot shows a clean look. */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
            <a href="mailto:Team@lenslearn.ai" className="hover:text-zinc-900 transition-colors">Team@lenslearn.ai</a>
            <span className="text-zinc-300">•</span>
            <a href="#" className="hover:text-zinc-900 transition-colors">Terms of Service</a>
            <span className="text-zinc-300">•</span>
            <a href="#" className="hover:text-zinc-900 transition-colors">Privacy Notice</a>
            <span className="text-zinc-300">•</span>
            <span className="text-zinc-500">LensLearnAI is a product of FactoLabs</span>
          </div>
        </div>
      </footer>
    </div >
  )
}
