import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Star } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { upgradeSubscriptionFn } from '../services/billing-funcs'

interface UpgradeModalProps {
    isOpen: boolean
    onClose: () => void
    onUpgradeSuccess: () => void
}

export function UpgradeModal({ isOpen, onClose, onUpgradeSuccess }: UpgradeModalProps) {
    const [isLoading, setIsLoading] = useState<'monthly' | 'yearly' | null>(null)

    const handleUpgrade = async (plan: 'pro_monthly' | 'pro_yearly') => {
        setIsLoading(plan === 'pro_monthly' ? 'monthly' : 'yearly')
        try {
            await upgradeSubscriptionFn({ data: { plan } })
            toast.success('Subscription upgraded successfully!')
            onUpgradeSuccess()
            onClose()
        } catch (error) {
            console.error(error)
            toast.error('Failed to upgrade subscription. Please try again.')
        } finally {
            setIsLoading(null)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-0 right-0 top-0 bottom-0 m-auto w-full max-w-4xl h-fit max-h-[90vh] overflow-y-auto bg-white rounded-3xl z-50 p-8 shadow-2xl"
                    >
                        <div className="absolute top-6 right-6">
                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center hover:bg-zinc-200 transition-colors"
                            >
                                <X size={20} className="text-zinc-500" />
                            </button>
                        </div>

                        <div className="text-center mb-12">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 text-amber-700 text-sm font-bold mb-6">
                                <Star size={16} className="fill-current" />
                                Upgrade to Pro
                            </div>
                            <h2 className="text-4xl lg:text-5xl font-display text-zinc-900 mb-4">Unlock Unlimited Learning</h2>
                            <p className="text-zinc-500 text-lg max-w-xl mx-auto">
                                You've reached your free limit. Upgrade to LensLearn Pro to explore unlimited worlds and generate limitless AI scenes.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                            {/* Free Tier */}
                            <div className="p-8 rounded-3xl border border-zinc-200 bg-zinc-50/50 flex flex-col opacity-60 grayscale-[0.5]">
                                <div className="mb-6">
                                    <h3 className="font-bold text-lg text-zinc-900">Free Starter</h3>
                                    <div className="mt-4 flex items-baseline gap-1">
                                        <span className="text-4xl font-display text-zinc-400">$0</span>
                                        <span className="text-zinc-400 font-medium">/forever</span>
                                    </div>
                                </div>
                                <ul className="space-y-4 mb-8 flex-1">
                                    <li className="flex items-start gap-3 text-sm text-zinc-500">
                                        <Check size={18} className="text-zinc-400 shrink-0" />
                                        <span>1 AI Scene Generation</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-sm text-zinc-500">
                                        <Check size={18} className="text-zinc-400 shrink-0" />
                                        <span>Basic Explanations</span>
                                    </li>
                                </ul>
                                <button disabled className="w-full py-4 rounded-xl bg-zinc-200 text-zinc-500 font-bold text-sm cursor-not-allowed">
                                    Current Plan
                                </button>
                            </div>

                            {/* Monthly Tier */}
                            <div className="relative p-8 rounded-3xl border-2 border-zinc-900 bg-white flex flex-col shadow-xl shadow-zinc-200">
                                <div className="mb-6">
                                    <h3 className="font-bold text-lg text-zinc-900">Pro Monthly</h3>
                                    <div className="mt-4 flex items-baseline gap-1">
                                        <span className="text-4xl font-display text-zinc-900">$9.99</span>
                                        <span className="text-zinc-500 font-medium">/month</span>
                                    </div>
                                </div>
                                <ul className="space-y-4 mb-8 flex-1">
                                    <li className="flex items-start gap-3 text-sm text-zinc-900">
                                        <Check size={18} className="text-green-500 shrink-0" />
                                        <span><strong>Unlimited</strong> AI Scenes</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-sm text-zinc-900">
                                        <Check size={18} className="text-green-500 shrink-0" />
                                        <span>Advanced AI Models</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-sm text-zinc-900">
                                        <Check size={18} className="text-green-500 shrink-0" />
                                        <span>Priority Support</span>
                                    </li>
                                </ul>
                                <button
                                    onClick={() => handleUpgrade('pro_monthly')}
                                    disabled={!!isLoading}
                                    className="w-full py-4 rounded-xl bg-zinc-900 text-white font-bold text-sm hover:scale-[1.02] transition-transform shadow-lg shadow-black/20 flex items-center justify-center gap-2"
                                >
                                    {isLoading === 'monthly' ? 'Processing...' : 'Upgrade Monthly'}
                                </button>
                            </div>

                            {/* Yearly Tier */}
                            <div className="relative p-8 rounded-3xl border border-amber-200 bg-amber-50/50 flex flex-col overflow-hidden">
                                <div className="absolute top-0 right-0 bg-amber-100 text-amber-800 text-xs font-bold px-4 py-2 rounded-bl-xl">
                                    BEST VALUE
                                </div>
                                <div className="mb-6">
                                    <h3 className="font-bold text-lg text-amber-900">Pro Yearly</h3>
                                    <div className="mt-4 flex items-baseline gap-1">
                                        <span className="text-4xl font-display text-amber-900">$99.99</span>
                                        <span className="text-amber-700 font-medium">/year</span>
                                    </div>
                                    <p className="text-xs text-amber-600 mt-2 font-bold">Save ~20% vs monthly</p>
                                </div>
                                <ul className="space-y-4 mb-8 flex-1">
                                    <li className="flex items-start gap-3 text-sm text-amber-900">
                                        <Check size={18} className="text-amber-600 shrink-0" />
                                        <span>Everything in Monthly</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-sm text-amber-900">
                                        <Check size={18} className="text-amber-600 shrink-0" />
                                        <span>Early Access Features</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-sm text-amber-900">
                                        <Check size={18} className="text-amber-600 shrink-0" />
                                        <span>Dedicated Personalization</span>
                                    </li>
                                </ul>
                                <button
                                    onClick={() => handleUpgrade('pro_yearly')}
                                    disabled={!!isLoading}
                                    className="w-full py-4 rounded-xl bg-amber-500 text-white font-bold text-sm hover:scale-[1.02] transition-transform shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                                >
                                    {isLoading === 'yearly' ? 'Processing...' : 'Upgrade Yearly'}
                                </button>
                            </div>
                        </div>

                        <p className="text-center text-xs text-zinc-400 mt-8">
                            Secured by Stripe. Cancel anytime. By upgrading, you agree to our Terms of Service.
                        </p>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
