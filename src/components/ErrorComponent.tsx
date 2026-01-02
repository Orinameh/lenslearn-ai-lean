import { motion } from 'framer-motion'
import { AlertCircle, RefreshCcw, Home, Sparkles } from 'lucide-react'
import { Link, useRouter, ErrorComponentProps } from '@tanstack/react-router'

export function ErrorComponent({ error, reset }: ErrorComponentProps) {
    const router = useRouter()

    // Handle various error formats
    const errorMessage = typeof error === 'string'
        ? error
        : (error as any)?.message || 'An unexpected error occurred'

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center max-w-md w-full"
            >
                <div className="relative inline-block mb-8">
                    <div className="w-24 h-24 rounded-[32px] bg-red-50 flex items-center justify-center shadow-inner">
                        <AlertCircle className="w-12 h-12 text-red-500" />
                    </div>
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-2 -right-2 text-zinc-200"
                    >
                        <Sparkles size={24} />
                    </motion.div>
                </div>

                <h2 className="text-3xl font-display text-zinc-900 mb-4">Something went wrong</h2>
                <p className="text-zinc-500 mb-10 leading-relaxed">
                    {errorMessage.includes('HTTPError')
                        ? "We're having trouble connecting to the server. Please check your connection and try again."
                        : errorMessage}
                </p>

                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => {
                            reset()
                            router.invalidate()
                        }}
                        className="flex items-center justify-center gap-2 bg-zinc-950 text-white py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all active:scale-95 shadow-lg shadow-black/10"
                    >
                        <RefreshCcw size={18} />
                        Try Again
                    </button>

                    <Link
                        to="/"
                        className="flex items-center justify-center gap-2 bg-white border border-black/5 text-zinc-900 py-4 rounded-2xl font-bold hover:bg-zinc-50 transition-all active:scale-95"
                    >
                        <Home size={18} />
                        Go Home
                    </Link>
                </div>

                <div className="mt-12 pt-8 border-t border-black/5">
                    <p className="text-[10px] text-zinc-300 uppercase tracking-[0.2em] font-black">
                        Error Details: {typeof error === 'object' ? JSON.stringify(error) : error}
                    </p>
                </div>
            </motion.div>
        </div>
    )
}
