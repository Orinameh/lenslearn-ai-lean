import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { User, Shield, Bell, Languages, Save, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getUserProfileFn, updateUserProfileFn } from '../services/user-funcs'
import { authGuard } from '../services/authMiddleware'

export const Route = createFileRoute('/profile')({
  beforeLoad: authGuard,
  component: ProfilePage,
})

function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    getUserProfileFn({ data: undefined }).then(data => {
      setProfile(data || {
        age_group: 'adult',
        voice_enabled: false,
        language: 'English'
      })
      setIsLoading(false)
    })
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    setMessage(null)
    try {
      await updateUserProfileFn({ data: profile })
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="animate-spin text-zinc-400" size={32} />
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-50 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-display text-zinc-900 mb-2">Profile Settings</h1>
          <p className="text-zinc-500">Manage your account preferences and learning settings.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="space-y-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white text-zinc-900 font-bold shadow-sm border border-black/5">
              <User size={18} /> Account
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-500 hover:bg-white hover:text-zinc-900 transition-all">
              <Shield size={18} /> Privacy
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-500 hover:bg-white hover:text-zinc-900 transition-all">
              <Bell size={18} /> Notifications
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-500 hover:bg-white hover:text-zinc-900 transition-all">
              <Languages size={18} /> Language
            </button>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            <section className="bg-white rounded-[32px] p-8 border border-black/5 shadow-sm">
              <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-8 ml-1">Learning Preferences</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-zinc-900 mb-3 ml-1">Age Group</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['kid', 'teen', 'adult'].map((group) => (
                      <button
                        key={group}
                        onClick={() => setProfile({ ...profile, age_group: group })}
                        className={`py-3 rounded-2xl border font-bold capitalize transition-all ${profile.age_group === group
                          ? 'bg-zinc-950 border-zinc-950 text-white shadow-lg shadow-black/10'
                          : 'bg-zinc-50 border-black/5 text-zinc-500 hover:border-black/10'
                          }`}
                      >
                        {group}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between py-4 border-t border-black/5">
                  <div>
                    <p className="font-bold text-zinc-900">Voice Explanations</p>
                    <p className="text-xs text-zinc-500">Have the AI guide read explanations aloud.</p>
                  </div>
                  <button
                    disabled
                    onClick={() => setProfile({ ...profile, voice_enabled: !profile.voice_enabled })}
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${profile.voice_enabled ? 'bg-zinc-950' : 'bg-zinc-200'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${profile.voice_enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-900 mb-3 ml-1">Language</label>
                  <select
                    value={profile.language}
                    onChange={(e) => setProfile({ ...profile, language: e.target.value })}
                    className="w-full bg-zinc-50 border border-black/5 rounded-2xl py-4 px-4 outline-none focus:ring-2 focus:ring-zinc-950/5 focus:border-zinc-950/20 transition-all text-zinc-900"
                  >
                    <option>English</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                    <option>Chinese</option>
                  </select>
                </div>
              </div>
            </section>

            <motion.div
              initial={false}
              animate={{ opacity: message ? 1 : 0, y: message ? 0 : 10 }}
              className={`p-4 rounded-2xl border text-sm font-bold text-center ${message?.type === 'success' ? 'bg-green-50 border-green-100 text-green-600' : 'bg-red-50 border-red-100 text-red-500'
                }`}
            >
              {message?.text}
            </motion.div>

            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-zinc-950 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-zinc-800 active:scale-[0.98] transition-all shadow-lg shadow-black/10 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
