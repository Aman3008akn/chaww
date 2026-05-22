'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Book, Sparkles, X, ArrowRight, BrainCircuit } from 'lucide-react'

interface Props {
  onTryNow: () => void
}

export default function NotebookFeaturePopup({ onTryNow }: Props) {
  const [isVisible, setIsVisible] = useState(false)

  // Show the popup a short delay after loading
  useEffect(() => {
    // Check if user has already seen this popup (optional persistence)
    const hasSeen = localStorage.getItem('astra_seen_notebook_popup')
    if (!hasSeen) {
      const timer = setTimeout(() => setIsVisible(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    localStorage.setItem('astra_seen_notebook_popup', 'true')
  }

  const handleTryNow = () => {
    setIsVisible(false)
    localStorage.setItem('astra_seen_notebook_popup', 'true')
    onTryNow()
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative w-full max-w-lg bg-[#0c0c0e] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Background Effects */}
            <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-emerald-500/20 to-transparent pointer-events-none" />
            <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-emerald-500/30 blur-[60px] rounded-full pointer-events-none" />

            <button 
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition z-50"
            >
              <X size={18} />
            </button>

            <div className="px-8 pt-10 pb-8 text-center relative z-10">
              {/* Icon */}
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(52,211,153,0.3)] border border-emerald-300/30 relative">
                <Book size={28} className="text-white" />
                <div className="absolute -top-2 -right-2 bg-black text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 shadow-lg">
                  NEW
                </div>
              </div>

              {/* Title & Description */}
              <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 tracking-tight mb-3">
                Meet Notebook Mode
              </h2>
              <p className="text-zinc-400 text-[15px] leading-relaxed mb-8 max-w-[90%] mx-auto">
                Transform your PDFs, text files, and URLs into a personalized AI Knowledge Base. Get answers instantly based <b>only</b> on your own documents.
              </p>

              {/* Features List */}
              <div className="bg-white/[0.03] rounded-2xl p-4 mb-8 text-left border border-white/5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="mt-0.5 w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Sparkles size={14} className="text-emerald-400" />
                  </div>
                  <p className="text-sm text-zinc-300"><span className="text-white font-medium">Context-Aware AI:</span> The AI reads your files and cites them in its answers.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <BrainCircuit size={14} className="text-emerald-400" />
                  </div>
                  <p className="text-sm text-zinc-300"><span className="text-white font-medium">Your Own Google NotebookLM:</span> Advanced RAG technology right inside Astra AI.</p>
                </div>
              </div>

              {/* CTA Button */}
              <button 
                onClick={handleTryNow}
                className="group relative w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-white text-black font-semibold text-[15px] overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Try it Now <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-100 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
