'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cpu, Code2, Sparkles, Zap, Check, ChevronDown } from 'lucide-react'

export type ModelType = 'nexus-4' | 'petran-5' | 'adat-pro'

interface Model {
  id: ModelType
  name: string
  version: string
  description: string
  icon: any
  color: string
  specialty: string
  tokenUsage: 'low' | 'medium' | 'high'
}

export const MODELS: Model[] = [
  {
    id: 'nexus-4',
    name: 'Nexus',
    version: '4.0',
    description: 'Expert in solving complex questions with precision',
    icon: Sparkles,
    color: 'from-blue-500 to-cyan-500',
    specialty: 'Complex problem solving, analysis, reasoning',
    tokenUsage: 'low',
  },
  {
    id: 'petran-5',
    name: 'Nexus Petran',
    version: '5',
    description: 'Expert in all coding and technical tasks',
    icon: Code2,
    color: 'from-purple-500 to-pink-500',
    specialty: 'Programming, debugging, architecture, algorithms',
    tokenUsage: 'medium',
  },
  {
    id: 'adat-pro',
    name: 'A-DAT',
    version: '(pro)',
    description: 'Ultimate Reasoning & Analytical Model for Pro Users',
    icon: Cpu,
    color: 'from-amber-500 via-orange-500 to-yellow-500',
    specialty: 'Advanced analysis, deep engineering solutions, max precision',
    tokenUsage: 'high',
  },
]

interface ModelSelectorProps {
  currentModel: ModelType
  onModelChange: (model: ModelType) => void
}

export default function ModelSelector({
  currentModel,
  onModelChange,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPremium, setIsPremium] = useState(false)

  useEffect(() => {
    // Check premium status on client mount
    const checkPremium = () => {
      const premium = typeof window !== 'undefined' ? localStorage.getItem('astra_premium') === 'true' : false
      setIsPremium(premium)
    }

    checkPremium()

    // Sync status on window focus
    window.addEventListener('focus', checkPremium)
    return () => window.removeEventListener('focus', checkPremium)
  }, [])

  // Close dropdown on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  // Filter models based on premium status
  const activeModels = isPremium
    ? MODELS
    : MODELS.filter(m => m.id !== 'adat-pro')

  const selectedModel = activeModels.find(m => m.id === currentModel) || activeModels[0]
  const isProModel = selectedModel.id === 'adat-pro'

  const handleModelSelect = (model: Model) => {
    onModelChange(model.id)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      {/* Model Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-300 group touch-manipulation min-h-[38px] relative overflow-hidden
          ${isProModel 
            ? 'bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-transparent border border-amber-500/35 hover:border-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:shadow-[0_0_20px_rgba(245,158,11,0.25)]' 
            : 'hover:bg-[var(--surface)] border border-transparent'}`}
      >
        {isProModel && (
          <span className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        )}
        <div className="flex items-center gap-2 relative z-10">
          {isProModel ? (
            <div className="flex items-center gap-1.5">
              <Cpu size={14} className="text-amber-400 animate-pulse" />
              <span className="text-sm font-extrabold bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent tracking-tight">
                A-DAT
              </span>
              <span className="text-[9px] font-black tracking-widest px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-[0_0_8px_rgba(245,158,11,0.45)] uppercase border border-amber-400/30 scale-95 origin-left">
                PRO
              </span>
            </div>
          ) : (
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {selectedModel.name} {selectedModel.version}
            </span>
          )}
          <ChevronDown 
            size={14} 
            className={`transition-transform duration-200 
              ${isProModel ? 'text-amber-400 group-hover:text-amber-300' : 'text-[var(--text-muted)]'} 
              ${isOpen ? 'rotate-180' : ''}`} 
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-full right-0 mt-2 w-72 bg-[var(--bg-secondary)] 
                         border border-[var(--surface-border)] rounded-xl shadow-2xl z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-[var(--surface-border)] bg-[var(--bg)]">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Select Model
                </h3>
              </div>

              {/* Model Options */}
              <div className="p-2 space-y-1">
                {activeModels.map((model, index) => {
                  const ModelIcon = model.icon
                  const isSelected = model.id === currentModel
                  const isModelPro = model.id === 'adat-pro'

                  return (
                    <motion.button
                      key={model.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleModelSelect(model)}
                      className={`w-full p-3 rounded-xl text-left transition-all duration-300 relative overflow-hidden group touch-manipulation
                        ${
                          isSelected
                            ? isModelPro
                              ? 'bg-gradient-to-r from-amber-500/15 via-yellow-500/5 to-transparent border border-amber-500/35 shadow-[0_0_12px_rgba(245,158,11,0.1)]'
                              : 'bg-[var(--accent)]/10 border border-[var(--accent)]/30'
                            : isModelPro
                            ? 'hover:bg-gradient-to-r hover:from-amber-500/5 hover:to-transparent border border-transparent hover:border-amber-500/15'
                            : 'hover:bg-[var(--surface)] border border-transparent'
                        }`}
                    >
                      {/* Premium subtle glow background decoration for PRO model */}
                      {isModelPro && (
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/5 to-yellow-500/0 rounded-full blur-xl pointer-events-none group-hover:from-amber-500/10 transition-all duration-300" />
                      )}
                      
                      <div className="flex items-center justify-between mb-1 relative z-10">
                        <div className="flex items-center gap-2">
                          {ModelIcon && (
                            <ModelIcon 
                              size={16} 
                              className={
                                isModelPro 
                                  ? "text-amber-400 group-hover:rotate-12 transition-transform duration-300" 
                                  : isSelected 
                                  ? "text-[var(--accent)]" 
                                  : "text-[var(--text-muted)]"
                              } 
                            />
                          )}
                          <span className={`text-sm font-semibold flex items-center gap-1.5
                            ${isModelPro ? 'text-amber-400 font-bold' : 'text-[var(--text-primary)]'}`}>
                            {model.name}
                            {isModelPro && (
                              <span className="text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-[0_0_6px_rgba(245,158,11,0.3)] uppercase">
                                PRO
                              </span>
                            )}
                          </span>
                        </div>
                        {isSelected && (
                          <Check size={14} className={isModelPro ? "text-amber-400" : "text-[var(--accent)]"} />
                        )}
                      </div>
                      
                      <p className="text-xs text-[var(--text-secondary)] relative z-10 pl-6">
                        {model.description}
                      </p>
                      
                      {isModelPro && (
                        <div className="mt-2 pl-6 text-[10px] text-amber-500/70 dark:text-amber-400/60 font-mono relative z-10 flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-amber-500 animate-ping" />
                          {model.specialty}
                        </div>
                      )}
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
