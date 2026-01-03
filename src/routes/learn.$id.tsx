import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
   Sparkles,
   Send,
   Info,
   Target,
   Zap,
   Volume2,
   ChevronLeft,
   Share2,
   Loader2
} from 'lucide-react'
import { getExplanationFn } from '../services/server-funcs'
import { UpgradeModal } from '../components/UpgradeModal'

import { authGuard } from '../services/authMiddleware'

export const Route = createFileRoute('/learn/$id')({
   beforeLoad: authGuard,
   component: LearnPage,
})

function LearnPage() {
   const { id } = Route.useParams()
   const router = useRouter()

   const [messages, setMessages] = useState([
      { role: 'assistant', text: "Welcome to this interactive world! I've analyzed the scene and identified 3 key learning hotspots for you to explore. Where would you like to start?" }
   ])
   const [input, setInput] = useState('')
   const [isLoading, setIsLoading] = useState(false)
   const [showUpgradeModal, setShowUpgradeModal] = useState(false)

   const handleSend = async () => {
      if (!input.trim() || isLoading) return
      const userMessage = input
      setMessages(prev => [...prev, { role: 'user', text: userMessage }])
      setInput('')
      setIsLoading(true)

      try {
         const response = await getExplanationFn({
            data: {
               context: "Global Context: Learning scene about " + id,
               question: userMessage,
               history: messages
            }
         })
         setMessages(prev => [...prev, { role: 'assistant', text: response || "I'm sorry, I couldn't generate an explanation right now." }])
      } catch (error: any) {
         console.error(error)
         if (error.message?.includes('PAYMENT_REQUIRED')) {
            setShowUpgradeModal(true)
            setMessages(prev => [...prev, { role: 'assistant', text: "You've reached your free limit. Please upgrade to continue learning." }])
         } else {
            setMessages(prev => [...prev, { role: 'assistant', text: "There was an error connecting to the AI guide." }])
         }
      } finally {
         setIsLoading(false)
      }
   }

   return (
      <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden bg-white">
         {/* Visual Scene Area */}
         <div className="flex-1 relative bg-zinc-50 flex flex-col">
            {/* Scene Header */}
            <div className="absolute top-6 left-6 right-6 z-20 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <button onClick={() => router.history.back()} className="w-10 h-10 rounded-full bg-white border border-black/5 flex items-center justify-center hover:bg-zinc-50 transition-colors shadow-sm">
                     <ChevronLeft size={20} className="text-zinc-400" />
                  </button>
                  <div className="bg-white px-4 py-2 rounded-2xl flex items-center gap-2 border border-black/5 shadow-sm">
                     <div className="w-2 h-2 rounded-full bg-green-500" />
                     <span className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest">{id}</span>
                  </div>
               </div>
               <div className="flex items-center gap-2">
                  <button className="w-10 h-10 rounded-full bg-white border border-black/5 flex items-center justify-center hover:bg-zinc-50 transition-colors shadow-sm">
                     <Volume2 size={18} className="text-zinc-400" />
                  </button>
                  <button className="w-10 h-10 rounded-full bg-white border border-black/5 flex items-center justify-center hover:bg-zinc-50 transition-colors shadow-sm">
                     <Share2 size={18} className="text-zinc-400" />
                  </button>
               </div>
            </div>

            {/* The Scene (Interactive Canvas/Image) */}
            <div className="flex-1 relative overflow-hidden group p-8">
               <div className="w-full h-full rounded-[40px] bg-white border border-black/5 shadow-2xl shadow-black/5 flex items-center justify-center relative overflow-hidden">
                  {/* This would be the AI generated scene */}
                  <Sparkles size={80} className="text-zinc-100 animate-pulse" />

                  {/* Hotspots (Interactive points) */}
                  <motion.button
                     initial={{ scale: 0 }}
                     animate={{ scale: 1 }}
                     className="absolute top-1/3 left-1/4 z-30 w-8 h-8 rounded-full bg-zinc-950 border-4 border-white shadow-xl flex items-center justify-center group/hotspot"
                  >
                     <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-zinc-950 text-white px-3 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap opacity-0 group-hover/hotspot:opacity-100 transition-opacity">
                        Historical Origin
                     </div>
                  </motion.button>

                  <motion.button
                     initial={{ scale: 0 }}
                     animate={{ scale: 1 }}
                     transition={{ delay: 0.2 }}
                     className="absolute top-1/2 right-1/3 z-30 w-8 h-8 rounded-full bg-zinc-950 border-4 border-white shadow-xl flex items-center justify-center group/hotspot"
                  >
                     <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-zinc-950 text-white px-3 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap opacity-0 group-hover/hotspot:opacity-100 transition-opacity">
                        Technical Detail
                     </div>
                  </motion.button>
               </div>
            </div>

            {/* Scene HUD/Labels */}
            <div className="h-24 bg-white border-t border-black/5 p-6 flex items-center gap-8 overflow-x-auto">
               <div className="flex items-center gap-3 shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-black/5 flex items-center justify-center">
                     <Target className="text-zinc-900" size={18} />
                  </div>
                  <div className="text-xs">
                     <p className="font-bold text-zinc-400 uppercase tracking-widest mb-1 text-[9px]">Session Goal</p>
                     <p className="font-bold text-zinc-900">Understand artistic perspective</p>
                  </div>
               </div>
               <div className="w-px h-8 bg-zinc-100 shrink-0" />
               <div className="flex items-center gap-3 shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-black/5 flex items-center justify-center">
                     <Zap className="text-zinc-900" size={18} />
                  </div>
                  <div className="text-xs">
                     <p className="font-bold text-zinc-400 uppercase tracking-widest mb-1 text-[9px]">Experience</p>
                     <p className="font-bold text-zinc-900">750 XP / 1000</p>
                  </div>
               </div>
            </div>
         </div>

         {/* Interaction Panel */}
         <div className="w-full lg:w-[400px] bg-white border-l border-black/5 flex flex-col">
            <div className="p-6 border-b border-black/5 flex items-center justify-between">
               <h3 className="font-bold flex items-center gap-2 text-zinc-900">
                  <Info size={18} className="text-zinc-400" />
                  AI Learning Guide
               </h3>
               <span className="text-[10px] font-bold bg-zinc-50 px-2 py-1 rounded border border-black/5 uppercase tracking-widest text-zinc-500">Flash 2.0</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
               {messages.map((m, i) => (
                  <div key={i} className={`flex flex-col mb-6 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                     <div className={`max-w-[85%] p-6 rounded-[24px] text-sm leading-7 shadow-sm ${m.role === 'user'
                        ? 'bg-zinc-900 text-white rounded-tr-sm shadow-zinc-900/10'
                        : 'bg-white border border-black/5 text-zinc-600 rounded-tl-sm shadow-black/5 overflow-hidden'
                        }`}>
                        {m.role === 'user' ? (
                           m.text
                        ) : (
                           <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                 h1: ({ node, ...props }: any) => <h1 className="text-xl font-display font-bold text-zinc-900 mt-6 mb-3 first:mt-0" {...props} />,
                                 h2: ({ node, ...props }: any) => <h2 className="text-lg font-display font-bold text-zinc-900 mt-5 mb-2 first:mt-0" {...props} />,
                                 h3: ({ node, ...props }: any) => <h3 className="text-base font-bold text-zinc-900 mt-4 mb-2" {...props} />,
                                 p: ({ node, ...props }: any) => <p className="mb-4 last:mb-0 leading-relaxed text-zinc-600" {...props} />,
                                 ul: ({ node, ...props }: any) => <ul className="space-y-2 mb-4 ml-1" {...props} />,
                                 ol: ({ node, ...props }: any) => <ol className="space-y-2 mb-4 list-decimal list-inside" {...props} />,
                                 li: ({ node, ...props }: any) => (
                                    <li className="flex gap-2">
                                       <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-zinc-300 shrink-0" />
                                       <span className="flex-1 text-zinc-600">{props.children}</span>
                                    </li>
                                 ),
                                 strong: ({ node, ...props }: any) => <strong className="font-bold text-zinc-900" {...props} />,
                                 em: ({ node, ...props }: any) => <em className="italic text-zinc-500" {...props} />,
                                 blockquote: ({ node, ...props }: any) => <blockquote className="border-l-4 border-zinc-200 pl-4 py-1 my-4 italic text-zinc-500 bg-zinc-50 rounded-r-lg" {...props} />,
                                 hr: ({ node, ...props }: any) => <hr className="my-6 border-zinc-100" {...props} />,
                                 code: ({ node, ...props }: any) => <code className="bg-zinc-100 text-pink-600 px-1.5 py-0.5 rounded text-xs font-mono font-bold" {...props} />
                              }}
                           >
                              {m.text}
                           </ReactMarkdown>
                        )}
                     </div>
                     <span className="text-[10px] font-bold text-zinc-300 mt-2 px-1 uppercase tracking-wider">
                        {m.role === 'user' ? 'You' : 'LensLearn Agent'}
                     </span>
                  </div>
               ))}
               {isLoading && (
                  <div className="flex flex-col items-start">
                     <div className="bg-white border border-black/5 p-3 rounded-2xl rounded-tl-sm shadow-sm opacity-80">
                        <Loader2 size={16} className="animate-spin text-zinc-400" />
                     </div>
                  </div>
               )}
            </div>

            {/* Input */}
            <div className="p-6 border-t border-black/5 bg-zinc-50/50">
               <div className="relative">
                  <textarea
                     value={input}
                     onChange={(e) => setInput(e.target.value)}
                     onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                           e.preventDefault()
                           handleSend()
                        }
                     }}
                     placeholder="Ask anything..."
                     className="w-full bg-white border border-black/10 rounded-2xl p-4 pr-12 text-sm outline-none focus:border-zinc-900 transition-colors shadow-sm resize-none h-24"
                  />
                  <button
                     onClick={handleSend}
                     disabled={isLoading}
                     className="absolute right-3 bottom-3 w-8 h-8 rounded-xl bg-zinc-950 text-white flex items-center justify-center hover:scale-105 transition-transform shadow-lg disabled:opacity-50"
                  >
                     <Send size={16} />
                  </button>
               </div>
               <p className="text-[10px] text-center text-zinc-300 mt-4 leading-relaxed tracking-tight">
                  Gemini can make mistakes. Verify important information.
               </p>
            </div>
         </div>

         <UpgradeModal
            isOpen={showUpgradeModal}
            onClose={() => setShowUpgradeModal(false)}
            onUpgradeSuccess={() => toast.success("You're now a Pro learner!")}
         />
      </div >
   )
}
