import { useRef, useEffect } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import {
   Sparkles,
   Send,
   Info,
   Target as TargetIcon,
   Zap,
   Volume2,
   ChevronLeft,
   Share2,
   Loader2
} from 'lucide-react'

import { useLearn } from 'utils/useLearn'
import { getLearningSessionFn } from '@/services/learning-funcs'



export const Route = createFileRoute('/learn/$id')({
   loader: async ({ params, location }) => {
      const search = location.search as { type?: 'text' | 'image'; session?: string }

      let mediaData = null
      let sessionData = null

      if (search.session) {
         try {
            sessionData = await getLearningSessionFn({ data: { id: search.session } })
            // POC: Skip fetching persistent media for the session
         } catch (e) {
            console.error("Failed to fetch session data:", e)
         }
      }

      if (search.type === 'image' && !mediaData) {
         // POC: Check transient store first
         const { currentSessionStore } = await import('../store')
         const storedData = currentSessionStore.get(params.id)

         if (storedData) {
            mediaData = {
               id: storedData.id,
               storage_url: storedData.imageUrl,
               analysis_data: storedData.analysis
            }
         } else {
            // POC: Mock media fallback for image learning (reloads)
            mediaData = {
               id: params.id,
               storage_url: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&q=80&w=800', // Placeholder
               analysis_data: {
                  hotspots: [],
                  suggestedGoal: "Explore this scene"
               }
            }
         }
      }

      // Convert kebab-case ID back to readable prompt
      const prompt = params.id.replace(/-/g, ' ')
      return { prompt, mediaData, sessionData }
   },
   component: LearnPage,
})



function LearnPage() {
   const { id } = Route.useParams()
   const search = Route.useSearch() as { type?: 'text' | 'image'; session?: string }
   const loaderData = Route.useLoaderData()
   const router = useRouter()
   const textareaRef = useRef<HTMLTextAreaElement>(null)

   const { messages,
      input,
      isLoading,
      handleSend,
      setInput,
      messagesContainerRef,
      messagesEndRef,
      showScene,
      modelId, } = useLearn(search, id, loaderData,)

   useEffect(() => {
      if (textareaRef.current) {
         textareaRef.current.style.height = 'auto'
         textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
      }
   }, [input])


   return (
      <div className={`flex flex-col ${showScene ? 'lg:flex-row' : ''} bg-white min-h-screen relative`}>
         {/* Visual Scene Area - Only show for image-based learning */}
         {
            showScene && (
               <div className="flex-1 lg:w-1/2 relative bg-zinc-50 flex flex-col lg:sticky lg:top-16 lg:h-[calc(100vh-64px)] overflow-hidden border-r border-black/5">
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
                        {/* Render the actual analyzed image */}
                        {loaderData.mediaData?.storage_url ? (
                           <div className="absolute inset-0 w-full h-full">
                              <img
                                 src={loaderData.mediaData.storage_url}
                                 alt="Learning Scene"
                                 className="w-full h-full object-cover transition-scale duration-700 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-black/5 transition-opacity group-hover:opacity-0" />
                           </div>
                        ) : (
                           <Sparkles size={80} className="text-zinc-100 animate-pulse" />
                        )}

                        {/* Hotspots (Interactive points) */}
                        {loaderData.mediaData?.analysis_data?.hotspots?.map((hotspot: any, idx: number) => (
                           <motion.button
                              key={hotspot.id || idx}
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: idx * 0.1 }}
                              style={{
                                 left: `${hotspot.x}%`,
                                 top: `${hotspot.y}%`,
                                 transform: 'translate(-50%, -50%)'
                              }}
                              onClick={() => setInput(`Tell me more about ${hotspot.label}: ${hotspot.description}`)}
                              className="absolute z-30 w-8 h-8 rounded-full bg-zinc-950 border-4 border-white shadow-xl flex items-center justify-center group/hotspot hover:scale-125 transition-transform"
                           >
                              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-zinc-950 text-white px-3 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap opacity-0 group-hover/hotspot:opacity-100 transition-opacity pointer-events-none">
                                 {hotspot.label}
                              </div>
                              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                           </motion.button>
                        ))}

                        {!loaderData.mediaData?.analysis_data?.hotspots && !isLoading && (
                           <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
                              <div className="text-center p-8 max-w-sm">
                                 {loaderData.mediaData ? (
                                    <>
                                       <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-black/5">
                                          <Loader2 className="animate-spin text-zinc-400" size={24} />
                                       </div>
                                       <p className="font-bold text-zinc-900">Preparing Interactive Scene...</p>
                                       <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                                          We're mapping hotspots and educational points. This usually takes a few seconds. If it stays like this, the 'analysis_data' column might be missing in your 'media' table.
                                       </p>
                                       <div className="mt-6 flex flex-col gap-2">
                                          <button
                                             onClick={() => window.location.reload()}
                                             className="text-[10px] font-bold uppercase tracking-widest text-zinc-900 border border-black/5 px-4 py-2 rounded-xl bg-white hover:bg-zinc-50 transition-colors shadow-sm"
                                          >
                                             Refresh Page
                                          </button>
                                          <button
                                             onClick={() => router.navigate({ to: '/' })}
                                             className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors"
                                          >
                                             Back to Upload
                                          </button>
                                       </div>
                                    </>
                                 ) : (
                                    <>
                                       <Info className="text-zinc-400 mb-4 mx-auto" size={32} />
                                       <p className="font-bold text-zinc-900">Scene Data Missing</p>
                                       <p className="text-xs text-zinc-500 mt-2">
                                          We couldn't find the data for this learning session.
                                       </p>
                                       <button
                                          onClick={() => router.navigate({ to: '/' })}
                                          className="mt-6 text-[10px] font-bold uppercase tracking-widest text-zinc-900 border border-black/5 px-4 py-2 rounded-xl bg-white hover:bg-zinc-50 transition-colors shadow-sm"
                                       >
                                          New Upload
                                       </button>
                                    </>
                                 )}
                              </div>
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Scene HUD/Labels */}
                  <div className="h-24 bg-white border-t border-black/5 p-6 flex items-center gap-8 overflow-x-auto">
                     <div className="flex items-center gap-3 shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-black/5 flex items-center justify-center">
                           <TargetIcon className="text-zinc-900" size={18} />
                        </div>
                        <div className="text-xs">
                           <p className="font-bold text-zinc-400 uppercase tracking-widest mb-1 text-[9px]">Session Goal</p>
                           <p className="font-bold text-zinc-900 text-wrap">
                              {loaderData.mediaData?.analysis_data?.suggestedGoal || "Understand artistic perspective"}
                           </p>
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
            )
         }

         {/* Interaction Panel */}
         <div className={`${showScene ? 'w-full lg:w-[400px]' : 'max-w-4xl mx-auto w-full'} bg-white flex flex-col min-h-screen`}>
            <div className="p-6 border-b border-black/5 flex items-center justify-between shrink-0 bg-white sticky top-16 z-20">
               <h3 className="font-bold flex items-center gap-2 text-zinc-900">
                  <Info size={18} className="text-zinc-400" />
                  AI Learning Guide
               </h3>
               <span className="text-[10px] font-bold bg-zinc-50 px-2 py-1 rounded border border-black/5 uppercase tracking-widest text-zinc-500">{modelId}</span>
            </div>

            {/* Messages Area - No internal scroll, uses window scroll */}
            <div ref={messagesContainerRef} className="p-6 space-y-6">
               {messages.map((m, i) => {
                  if (m.text === "") return null;
                  return (
                     <div key={i} className={`flex flex-col mb-6 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={` py-3 px-4 rounded-[24px] text-sm leading-7 shadow-sm ${m.role === 'user'
                           ? 'bg-zinc-900 text-white rounded-tr-sm shadow-zinc-900/10 max-w-[50%]'
                           : 'bg-white border border-black/5 text-zinc-600 rounded-tl-sm shadow-black/5 overflow-hidden max-w-[85%]'
                           }`}>
                           {m.role === 'user' ? (
                              m.text
                           ) : (
                              <ReactMarkdown
                                 remarkPlugins={[remarkGfm, remarkMath]}
                                 rehypePlugins={[rehypeKatex]}
                                 components={{
                                    h1: ({ node, ...props }: any) => <h1 className="text-xl font-display font-bold text-zinc-900 mt-6 mb-3 first:mt-0" {...props} />,
                                    h2: ({ node, ...props }: any) => <h2 className="text-lg font-display font-bold text-zinc-900 mt-5 mb-2 first:mt-0" {...props} />,
                                    h3: ({ node, ...props }: any) => <h3 className="text-base font-display font-bold text-zinc-900 mt-4 mb-2" {...props} />,
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
                                    code: ({ node, inline, ...props }: any) => {
                                       // Inline code (not math)
                                       if (inline) {
                                          return <code className="bg-zinc-100 text-pink-600 px-1.5 py-0.5 rounded text-xs font-mono font-bold" {...props} />
                                       }
                                       // Code blocks
                                       return <code className="block bg-zinc-100 text-pink-600 p-3 rounded text-sm font-mono overflow-x-auto" {...props} />
                                    }
                                 }}
                              >
                                 {m.text}
                              </ReactMarkdown>
                           )}
                        </div>
                        <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest mt-2 px-1">
                           {m.role === 'user' ? 'You' : 'LensLearn Agent'}
                        </span>
                     </div>
                  )
               })}
               {isLoading && (
                  <div className="flex flex-col items-start">
                     <div className="bg-white border border-black/5 p-3 rounded-2xl rounded-tl-sm shadow-sm opacity-80">
                        <Loader2 size={16} className="animate-spin text-zinc-400" />
                     </div>
                  </div>
               )}
               <div ref={messagesEndRef} className="h-4" />
            </div>

            {/* Input - Sticky at VERY bottom of viewport */}
            <div className="p-6 border-t border-black/5 bg-white/80 backdrop-blur-md sticky bottom-0 z-30">
               <div className="relative">
                  <textarea
                     ref={textareaRef}
                     value={input}
                     onChange={(e) => setInput(e.target.value)}
                     onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                           e.preventDefault()
                           handleSend()
                        }
                     }}
                     rows={1}
                     placeholder="Ask anything..."
                     className="w-full bg-white border border-black/10 rounded-2xl p-4 pr-12 text-sm outline-none focus:border-zinc-900 transition-colors shadow-sm resize-none min-h-[56px] max-h-[200px]"
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

      </div >
   )
}
