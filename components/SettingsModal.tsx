'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Moon, Sun, Monitor, BrainCircuit, Bell, Shield } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsModal({ isOpen, onClose }: Props) {
  const { theme, setTheme } = useTheme()
  const [autoThink, setAutoThink] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAutoThink(localStorage.getItem('autoThink') !== 'false')
    }
  }, [isOpen])

  const toggleAutoThink = () => {
    const newValue = !autoThink
    setAutoThink(newValue)
    localStorage.setItem('autoThink', String(newValue))
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-[#0c0c0e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Shield size={18} className="text-emerald-400" />
                Settings
              </h2>
              <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition">
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Theme Settings */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-3">Appearance</h3>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setTheme('light')}
                    className={cn("flex flex-col items-center gap-2 p-3 rounded-xl border transition-all", theme === 'light' ? "bg-white/10 border-white/20 text-white" : "border-white/5 text-zinc-500 hover:text-zinc-300 hover:bg-white/5")}
                  >
                    <Sun size={20} />
                    <span className="text-xs font-medium">Light</span>
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={cn("flex flex-col items-center gap-2 p-3 rounded-xl border transition-all", theme === 'dark' ? "bg-white/10 border-white/20 text-white" : "border-white/5 text-zinc-500 hover:text-zinc-300 hover:bg-white/5")}
                  >
                    <Moon size={20} />
                    <span className="text-xs font-medium">Dark</span>
                  </button>
                  <button
                    onClick={() => setTheme('system')}
                    className={cn("flex flex-col items-center gap-2 p-3 rounded-xl border transition-all", theme === 'system' ? "bg-white/10 border-white/20 text-white" : "border-white/5 text-zinc-500 hover:text-zinc-300 hover:bg-white/5")}
                  >
                    <Monitor size={20} />
                    <span className="text-xs font-medium">System</span>
                  </button>
                </div>
              </div>

              {/* Advanced Features */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-3">Advanced Options</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                        <BrainCircuit size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Auto-Think Mode</p>
                        <p className="text-xs text-zinc-500">Automatically analyze complex queries before responding.</p>
                      </div>
                    </div>
                    <button 
                      onClick={toggleAutoThink}
                      className={cn(
                        "w-11 h-6 rounded-full transition-colors relative",
                        autoThink ? "bg-emerald-500" : "bg-zinc-700"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all shadow-sm",
                        autoThink ? "left-[22px]" : "left-0.5"
                      )} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                        <Bell size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Push Notifications</p>
                        <p className="text-xs text-zinc-500">Get alerted when Deep Research completes.</p>
                      </div>
                    </div>
                    <button className="w-11 h-6 rounded-full bg-zinc-700 relative opacity-50 cursor-not-allowed">
                      <div className="w-5 h-5 rounded-full bg-white absolute top-0.5 left-0.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-white/5 bg-white/5 flex justify-end">
              <button onClick={onClose} className="px-6 py-2 rounded-lg bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition">
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
