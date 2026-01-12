import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Baby,
    Headphones,
    Coffee,
    Brain,
    Eye,
    Ear,
    Hand,
    ChevronDown,
    Loader2
} from 'lucide-react'
// import { getUserProfileFn, updateUserProfileFn } from '../services/user-funcs'
import { userPreferencesStore } from '../store'
import toast from 'react-hot-toast'



export function PreferencesBar() {
    const [updating, setUpdating] = useState(false)
    const defaults = userPreferencesStore.get()
    const [ageGroup, setAgeGroup] = useState<'kid' | 'teen' | 'adult'>(defaults.ageGroup as any)
    const [learningStyle, setLearningStyle] = useState<'visual' | 'auditory' | 'textual' | 'balanced'>(defaults.learningStyle as any)

    const [openDropdown, setOpenDropdown] = useState<'age' | 'style' | null>(null)


    const updatePreference = (type: 'age' | 'style', value: string) => {
        setUpdating(true)
        setOpenDropdown(null)

        let newAge = ageGroup
        let newStyle = learningStyle

        if (type === 'age') {
            newAge = value as any
            setAgeGroup(newAge)
        }
        if (type === 'style') {
            newStyle = value as any
            setLearningStyle(newStyle)
        }

        try {
            userPreferencesStore.set({ ageGroup: newAge, learningStyle: newStyle })
            toast.success('Preference updated', { id: 'pref-update', duration: 1000 })
        } catch (e) {
            console.error(e)
            toast.error('Failed to save preference')
        } finally {
            setUpdating(false)
        }
    }


    const ageOptions = [
        { value: 'kid', label: 'Kid', icon: Baby, desc: 'Simple & Fun' },
        { value: 'teen', label: 'Teen', icon: Headphones, desc: 'Engaging & Cool' },
        { value: 'adult', label: 'Adult', icon: Coffee, desc: 'Pro & Detailed' },
    ]

    const styleOptions = [
        { value: 'balanced', label: 'Balanced', icon: Brain, desc: 'Mix of all styles' },
        { value: 'visual', label: 'Visual', icon: Eye, desc: 'Detailed descriptions' },
        { value: 'auditory', label: 'Auditory', icon: Ear, desc: 'Conversational tone' },
        // { value: 'textual', label: 'Textual', icon: FileText, desc: 'In-depth reading' }, // limiting for simplicity as requested?
        // User asked for specific ones, let's stick to the main ones + aligned with screenshot
        { value: 'hands-on', label: 'Hands-on', icon: Hand, desc: 'Interactive tasks' },
    ]

    // Map local state to display
    const currentAge = ageOptions.find(o => o.value === ageGroup) || ageOptions[2]
    // Fix type mismatch for style if 'textual' vs 'hands-on'
    // changing state type to match options

    return (
        <div className="flex flex-wrap items-center gap-3 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Age Group Selector */}
            <div className="relative">
                <button
                    onClick={() => setOpenDropdown(openDropdown === 'age' ? null : 'age')}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-black/10 rounded-full text-xs font-semibold text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 transition-all shadow-sm"
                >
                    <currentAge.icon size={14} />
                    <span>{currentAge.label}</span>
                    <ChevronDown size={12} className={`opacity-50 transition-transform ${openDropdown === 'age' ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                    {openDropdown === 'age' && (
                        <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                            className="absolute top-full mt-2 left-0 w-48 bg-white border border-black/10 rounded-xl shadow-xl p-1 z-50 flex flex-col gap-1"
                        >
                            {ageOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => updatePreference('age', opt.value)}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${ageGroup === opt.value ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'}`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${ageGroup === opt.value ? 'bg-white shadow-sm border border-black/5' : 'bg-transparent'}`}>
                                        <opt.icon size={16} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold">{opt.label}</span>
                                        <span className="text-[10px] opacity-70">{opt.desc}</span>
                                    </div>
                                    {ageGroup === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-green-500 ml-auto" />}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Learning Style Selector */}
            <div className="relative">
                <button
                    onClick={() => setOpenDropdown(openDropdown === 'style' ? null : 'style')}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-black/10 rounded-full text-xs font-semibold text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 transition-all shadow-sm"
                >
                    <Brain size={14} />
                    <span className="capitalize">{learningStyle.replace('-', ' ')}</span>
                    <ChevronDown size={12} className={`opacity-50 transition-transform ${openDropdown === 'style' ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                    {openDropdown === 'style' && (
                        <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                            className="absolute top-full mt-2 left-0 w-52 bg-white border border-black/10 rounded-xl shadow-xl p-1 z-50 flex flex-col gap-1"
                        >
                            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 border-b border-black/5 mb-1">
                                Learning Style
                            </div>
                            {styleOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => updatePreference('style', opt.value)}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${learningStyle === opt.value ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'}`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${learningStyle === opt.value ? 'bg-white shadow-sm border border-black/5' : 'bg-transparent'}`}>
                                        <opt.icon size={16} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold">{opt.label}</span>
                                        <span className="text-[10px] opacity-70">{opt.desc}</span>
                                    </div>
                                    {learningStyle === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-green-500 ml-auto" />}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {updating && <Loader2 size={12} className="animate-spin text-zinc-300" />}

        </div>
    )
}
