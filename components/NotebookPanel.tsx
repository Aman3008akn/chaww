'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Book, Upload, FileText, Link as LinkIcon, Trash2, X, File, Plus } from 'lucide-react'

interface Source {
  id: string
  name: string
  type: 'pdf' | 'text' | 'url'
  url?: string
  snippet?: string
  createdAt: number
}

interface Props {
  onClose?: () => void
}

export default function NotebookPanel({ onClose }: Props) {
  const [sources, setSources] = useState<Source[]>([
    // Mock data for initial UI
    { id: '1', name: 'Product_Requirements_v2.pdf', type: 'pdf', createdAt: Date.now() - 100000 },
    { id: '2', name: 'Meeting_Notes_Q3.txt', type: 'text', createdAt: Date.now() - 500000 },
  ])
  const [isUploading, setIsUploading] = useState(false)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setIsUploading(true)
    
    // Simulate upload delay
    setTimeout(() => {
      const newSource: Source = {
        id: Math.random().toString(36).substring(7),
        name: file.name,
        type: file.name.endsWith('.pdf') ? 'pdf' : 'text',
        createdAt: Date.now(),
      }
      setSources([newSource, ...sources])
      setIsUploading(false)
    }, 1500)
  }

  const removeSource = (id: string) => {
    setSources(sources.filter(s => s.id !== id))
  }

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] border-l border-white/5 w-full md:w-[350px] lg:w-[400px] shadow-2xl relative">
      {/* Header */}
      <div className="flex-shrink-0 px-5 py-4 border-b border-white/5 flex items-center justify-between bg-black/20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Book size={16} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Knowledge Base</h2>
            <p className="text-[11px] text-zinc-500">Your custom sources</p>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {/* Upload Section */}
        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Add New Source</label>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition cursor-pointer group">
              <input type="file" className="hidden" accept=".pdf,.txt,.md" onChange={handleFileUpload} disabled={isUploading} />
              <Upload size={18} className="text-zinc-400 group-hover:text-emerald-400 transition" />
              <span className="text-xs font-medium text-zinc-300">Upload File</span>
            </label>
            <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition group">
              <LinkIcon size={18} className="text-zinc-400 group-hover:text-blue-400 transition" />
              <span className="text-xs font-medium text-zinc-300">Add URL</span>
            </button>
          </div>
          {isUploading && (
            <div className="text-[11px] text-emerald-400/80 animate-pulse flex items-center gap-1.5">
              <div className="w-3 h-3 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              Processing document...
            </div>
          )}
        </div>

        {/* Sources List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Active Sources ({sources.length})</label>
          </div>
          
          <div className="space-y-2">
            {sources.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-sm">
                No sources added yet.
              </div>
            ) : (
              sources.map((source) => (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={source.id} 
                  className="group flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition"
                >
                  <div className="mt-0.5">
                    {source.type === 'pdf' ? (
                      <File size={16} className="text-red-400" />
                    ) : source.type === 'text' ? (
                      <FileText size={16} className="text-blue-400" />
                    ) : (
                      <LinkIcon size={16} className="text-emerald-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate">{source.name}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      {new Date(source.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button 
                    onClick={() => removeSource(source.id)}
                    className="p-1.5 rounded-lg text-zinc-500 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              ))
            )}
          </div>
        </div>

      </div>
      
      {/* Footer Info */}
      <div className="p-4 border-t border-white/5 bg-white/[0.02]">
        <p className="text-[11px] text-zinc-500 leading-relaxed text-center">
          When you ask a question, the AI will use your active sources to provide context-aware answers.
        </p>
      </div>
    </div>
  )
}
