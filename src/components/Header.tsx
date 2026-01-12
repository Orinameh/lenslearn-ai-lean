import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Menu,
  X,
  Sparkles,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)

  const navLinks = [
    { label: 'Explore', href: '/explore' },
  ]



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

          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
