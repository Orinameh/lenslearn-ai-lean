import { createFileRoute, Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Check, Star, Zap, Globe, Sparkles, ShieldCheck } from 'lucide-react'

export const Route = createFileRoute('/pricing')({
    component: RouteComponent,
})

function RouteComponent() {
    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-6 overflow-hidden">
                <div className="absolute inset-0 -z-10">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-amber-50/50 to-transparent opacity-50 blur-3xl" />
                </div>

                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100/50 border border-amber-200 text-amber-800 text-sm font-bold mb-8 backdrop-blur-sm"
                    >
                        <Sparkles size={16} className="fill-amber-500 text-amber-500" />
                        <span>Invest in your infinite curiosity</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl font-display text-zinc-900 mb-6 tracking-tight leading-tight"
                    >
                        Simple pricing for <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">unlimited wisdom.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-zinc-500 max-w-2xl mx-auto leading-relaxed"
                    >
                        Start exploring the world for free. Upgrade to unlock an interactive AI guide that never tires, available 24/7 in any language.
                    </motion.p>
                </div>
            </section>

            {/* Pricing Cards */}
            <section className="px-6 pb-32">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-start">

                    {/* Free Tier */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="p-8 rounded-3xl border border-zinc-200 bg-white hover:border-zinc-300 transition-colors"
                    >
                        <div className="mb-8">
                            <h3 className="font-bold text-xl text-zinc-900">Explorer</h3>
                            <p className="text-sm text-zinc-500 mt-2">Perfect for trying out the experience.</p>
                            <div className="mt-6 flex items-baseline gap-1">
                                <span className="text-4xl font-display text-zinc-900">$0</span>
                            </div>
                        </div>
                        <ul className="space-y-4 mb-8">
                            <li className="flex items-start gap-3 text-sm text-zinc-600">
                                <Check size={18} className="text-zinc-900 shrink-0 mt-0.5" />
                                <span>1 Free AI Scene Analysis</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-zinc-600">
                                <Check size={18} className="text-zinc-900 shrink-0 mt-0.5" />
                                <span>Standard Learning Modes</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-zinc-600">
                                <Check size={18} className="text-zinc-900 shrink-0 mt-0.5" />
                                <span>Access to Public Gallery</span>
                            </li>
                        </ul>
                        <Link to="/login" className="block w-full py-3 rounded-xl border border-zinc-200 text-zinc-900 font-bold text-center hover:bg-zinc-50 transition-colors">
                            Get Started Free
                        </Link>
                    </motion.div>

                    {/* Pro Monthly */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                        className="relative p-8 rounded-3xl bg-zinc-900 text-white shadow-2xl shadow-zinc-900/20 md:-mt-8 md:mb-8 transform md:scale-105"
                    >
                        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-bold text-xl text-white">Pro Monthly</h3>
                                <span className="px-3 py-1 rounded-full bg-white/10 text-[10px] font-bold tracking-wider uppercase">Popular</span>
                            </div>
                            <p className="text-sm text-zinc-400">For serious learners and travelers.</p>
                            <div className="mt-6 flex items-baseline gap-1">
                                <span className="text-5xl font-display text-white">$9.99</span>
                                <span className="text-zinc-400 font-medium">/month</span>
                            </div>
                        </div>
                        <ul className="space-y-4 mb-8">
                            <li className="flex items-start gap-3 text-sm text-zinc-200">
                                <Check size={18} className="text-amber-500 shrink-0 mt-0.5" />
                                <span><strong>Unlimited</strong> Scene Analysis</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-zinc-200">
                                <Check size={18} className="text-amber-500 shrink-0 mt-0.5" />
                                <span><strong>Advanced AI</strong> (Flash 3.0)</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-zinc-200">
                                <Check size={18} className="text-amber-500 shrink-0 mt-0.5" />
                                <span>High-Resolution Processing</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-zinc-200">
                                <Check size={18} className="text-amber-500 shrink-0 mt-0.5" />
                                <span>Priority Generation Speed</span>
                            </li>
                        </ul>
                        <Link to="/login" className="block w-full py-4 rounded-xl bg-white text-zinc-900 font-bold text-center hover:bg-zinc-100 transition-colors">
                            Start Monthly Plan
                        </Link>
                    </motion.div>

                    {/* Pro Yearly */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 }}
                        className="p-8 rounded-3xl border border-amber-200 bg-gradient-to-b from-amber-50/50 to-white"
                    >
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-bold text-xl text-amber-900">Scholar Yearly</h3>
                                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold tracking-wider uppercase">Best Value</span>
                            </div>
                            <p className="text-sm text-zinc-500 mt-2">Maximum savings for life-long learners.</p>
                            <div className="mt-6 flex items-baseline gap-1">
                                <span className="text-4xl font-display text-zinc-900">$99.99</span>
                                <span className="text-zinc-500 font-medium">/year</span>
                            </div>
                            <p className="text-xs font-bold text-amber-600 mt-2">Save $20 per year</p>
                        </div>
                        <ul className="space-y-4 mb-8">
                            <li className="flex items-start gap-3 text-sm text-zinc-600">
                                <Check size={18} className="text-amber-600 shrink-0 mt-0.5" />
                                <span>Everything in Pro Monthly</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-zinc-600">
                                <Check size={18} className="text-amber-600 shrink-0 mt-0.5" />
                                <span>Early access to new features</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-zinc-600">
                                <Check size={18} className="text-amber-600 shrink-0 mt-0.5" />
                                <span>Support our educational mission</span>
                            </li>
                        </ul>
                        <Link to="/login" className="block w-full py-3 rounded-xl bg-amber-100 text-amber-900 border border-amber-200 font-bold text-center hover:bg-amber-200 transition-colors">
                            Get Yearly Access
                        </Link>
                    </motion.div>
                </div>

                {/* Trust/Footer Strip */}
                <div className="max-w-4xl mx-auto mt-20 pt-10 border-t border-zinc-100 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    <div className="flex flex-col items-center gap-2">
                        <Globe size={20} className="text-zinc-400" />
                        <span className="text-xs font-medium text-zinc-500">Global Content</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <Zap size={20} className="text-zinc-400" />
                        <span className="text-xs font-medium text-zinc-500">Flash 3.0 Speed</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <ShieldCheck size={20} className="text-zinc-400" />
                        <span className="text-xs font-medium text-zinc-500">Secure Billing</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <Star size={20} className="text-zinc-400" />
                        <span className="text-xs font-medium text-zinc-500">Premium Quality</span>
                    </div>
                </div>
            </section>
        </div>
    )
}
