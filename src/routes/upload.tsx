import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Upload as UploadIcon,
  X,
  Sparkles,
  BrainCircuit,
  Lightbulb,
  Loader2,
  History
} from 'lucide-react'
import { analyzeSceneFn } from '../services/server-funcs'
import { getCloudinarySignatureFn, uploadMediaFn } from '../services/media-funcs'
import { UpgradeModal } from '../components/UpgradeModal'

import { authGuard } from '../services/authMiddleware'

export const Route = createFileRoute('/upload')({
  beforeLoad: authGuard,
  component: UploadPage,
})

function UploadPage() {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const handleFile = (f: File) => {
    if (f.type.startsWith('image/')) {
      setFile(f)
      setPreview(URL.createObjectURL(f))
    }
  }

  const handleAnalyze = async () => {
    if (!file) return
    setIsAnalyzing(true)

    try {
      // 1. Get Signed Signature from Server
      const signData = await getCloudinarySignatureFn()

      // 2. Upload to Cloudinary directly from Client
      const formData = new FormData()
      formData.append('file', file)
      formData.append('api_key', signData.apiKey!)
      formData.append('timestamp', signData.timestamp.toString())
      formData.append('signature', signData.signature)
      formData.append('folder', signData.folder)

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      )

      if (!response.ok) throw new Error('Cloudinary upload failed')
      const cloudinaryResult = await response.json()
      const storageUrl = cloudinaryResult.secure_url

      // 3. Save Metadata to Supabase
      const media = await uploadMediaFn({
        data: {
          type: 'image',
          storage_url: storageUrl,
          is_watermarked: false
        }
      })

      // 4. Analyze Scene (using base64 for Gemini as before, but now we have the URL stored)
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1]
        await analyzeSceneFn({ data: { base64, mimeType: file.type } })
        toast.success("Scene generated successfully!")
        navigate({ to: '/learn/$id', params: { id: media.id }, search: { type: 'image' } })
      }
    } catch (error: any) {
      console.error("Upload or Analysis failed", error)
      if (error.message?.includes('PAYMENT_REQUIRED')) {
        setShowUpgradeModal(true)
      } else {
        toast.error(error.message || "Failed to process image")
      }
    } finally {
      setIsAnalyzing(false)
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0])
  }

  return (
    <div className="max-w-4xl mx-auto p-8 lg:p-12">
      <div className="mb-12">
        <h1 className="text-5xl font-display text-zinc-900 mb-4">Upload & Learn</h1>
        <p className="text-zinc-500">Transform any image into an interactive learning scene.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          {/* Dropzone */}
          {!preview ? (
            <motion.div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              className={`aspect-video rounded-[32px] border-2 border-dashed transition-all flex flex-col items-center justify-center p-12 text-center group ${isDragging ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200 hover:border-zinc-300 bg-white'
                }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-zinc-50 border border-black/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <UploadIcon size={32} className="text-zinc-400" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 mb-2 font-sans">Drag and drop an image</h3>
              <p className="text-zinc-400 mb-8 max-w-xs text-sm">Supports JPG, PNG, and WebP. Max size 10MB.</p>
              <label className="px-8 py-3 bg-zinc-950 text-white font-bold rounded-xl cursor-pointer hover:bg-zinc-800 transition-colors shadow-lg shadow-black/10">
                Browse Files
                <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </label>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative aspect-video rounded-[32px] overflow-hidden border border-black/5 bg-zinc-50 shadow-inner"
            >
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/10" />
              <button
                onClick={() => { setFile(null); setPreview(null) }}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center hover:bg-zinc-100 transition-colors shadow-sm"
                disabled={isAnalyzing}
              >
                <X size={20} className="text-zinc-900" />
              </button>

              <div className="absolute bottom-10 left-10 right-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-lg border border-black/5">
                    <Sparkles className="text-zinc-900" size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-lg text-white drop-shadow-md">Ready to Analyze</p>
                  </div>
                </div>
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="px-8 py-4 bg-zinc-950 text-white font-bold rounded-2xl flex items-center gap-2 hover:scale-105 transition-transform shadow-xl shadow-black/40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? (
                    <>Analyzing... <Loader2 className="animate-spin" size={20} /></>
                  ) : (
                    <>Generate Scene <BrainCircuit size={20} /></>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* AI Intent Selection */}
          <div className="space-y-4">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Choose Learning Intent</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button className="p-6 rounded-2xl border border-zinc-900 text-left bg-zinc-50 transition-all">
                <div className="flex items-center gap-3 mb-3 text-zinc-900">
                  <Sparkles size={18} />
                  <span className="font-bold">Auto-Detect</span>
                </div>
                <p className="text-sm text-zinc-500 leading-relaxed">Let Gemini analyze and decide the best learning path.</p>
              </button>
              <button className="p-6 rounded-2xl border border-zinc-100 text-left hover:border-zinc-300 transition-all bg-white">
                <div className="flex items-center gap-3 mb-3 text-zinc-400">
                  <History size={18} />
                  <span className="font-bold">Historical Context</span>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">Deep dive into the history and origins of the subject.</p>
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
          <div className="p-8 rounded-3xl bg-zinc-50 border border-black/5">
            <h3 className="font-bold text-zinc-900 mb-6 flex items-center gap-2">
              <Lightbulb size={20} className="text-zinc-900" />
              Pro Tips
            </h3>
            <ul className="space-y-6">
              {[
                { title: 'Contrast Matters', desc: 'Clear, high-contrast images yield the best interaction points.' },
                { title: 'Subject Focus', desc: 'Try to center the primary learning object for better analysis.' }
              ].map((tip, i) => (
                <li key={i}>
                  <p className="font-bold text-sm text-zinc-900 mb-1">{tip.title}</p>
                  <p className="text-xs text-zinc-500 leading-relaxed">{tip.desc}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onUpgradeSuccess={() => {
          // Re-trigger analysis if they just paid? Or just let them click again.
          // Letting them click again is safer/easier UX.
          toast.success("Ready to create! Click Generate Scene again.")
        }}
      />
    </div>
  )
}
