import { Link, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Menu,
  X,
  Sparkles,
  LogOut,
  User
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { logoutUserFn } from '../services/auth-funcs'
import { useAuthStore } from '../services/authStore'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const router = useRouter()

  const navLinks = [
    { label: 'Explore', href: '/explore' },
    { label: 'Upload', href: '/upload' },
    { label: 'Pricing', href: '/pricing' },
  ]

  const handleSignout = async () => {
    await logoutUserFn()
    logout()
    router.invalidate()
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md z-50 border-b border-black/5">
      <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-zinc-950 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Sparkles className="text-white w-5 h-5" />
          </div>
          <span className="font-sans font-bold text-lg tracking-tight text-zinc-900">lenslearn</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-4">
              <Link
                to="/profile"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-50 border border-black/5 hover:bg-zinc-100 transition-colors"
                title="Profile Settings"
              >
                <div className="w-6 h-6 rounded-full bg-zinc-900 flex items-center justify-center">
                  <User size={12} className="text-white" />
                </div>
                <span className="text-xs font-bold text-zinc-900">{user.email?.split('@')[0]}</span>
              </Link>
              <button
                onClick={handleSignout}
                className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
                title="Sign out"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-bold bg-zinc-950 text-white rounded-lg hover:bg-zinc-800 transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 text-sm font-bold bg-zinc-100 text-zinc-900 rounded-lg hover:bg-zinc-200 transition-colors border border-black/5"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 text-zinc-900"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Nav Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-0 right-0 bg-white border-b border-black/5 shadow-xl p-6 md:hidden flex flex-col gap-6"
          >
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                onClick={() => setIsOpen(false)}
                className="text-lg font-medium text-zinc-900"
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-3 pt-6 border-t border-black/5">
              {user ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setIsOpen(false)}
                    className="w-full py-3 font-bold bg-zinc-50 text-zinc-900 rounded-xl border border-black/5 flex items-center justify-center gap-2"
                  >
                    <User size={18} />
                    Profile Settings
                  </Link>
                  <button
                    onClick={() => {
                      handleSignout()
                      setIsOpen(false)
                    }}
                    className="w-full py-3 font-bold bg-zinc-100 text-zinc-900 rounded-xl border border-black/5 flex items-center justify-center gap-2"
                  >
                    <LogOut size={18} />
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="w-full py-3 font-bold bg-zinc-950 text-white rounded-xl text-center"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setIsOpen(false)}
                    className="w-full py-3 font-bold bg-zinc-100 text-zinc-900 rounded-xl border border-black/5 text-center"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
