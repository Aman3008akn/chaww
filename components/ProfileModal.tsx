'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, User, LogOut, Mail, Clock, Crown, ShieldAlert } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function ProfileModal({ isOpen, onClose }: Props) {
  const { data: session } = useSession()
  const [guestProfile, setGuestProfile] = useState<{ id: string; username: string } | null>(null)
  const isPremium = typeof window !== 'undefined' ? localStorage.getItem('astra_premium') === 'true' : false

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('guest_profile')
      if (raw) {
        try {
          setGuestProfile(JSON.parse(raw))
        } catch {}
      }
    }
  }, [isOpen])

  const isLoggedIn = !!session?.user || !!guestProfile

  const handleLogout = async () => {
    if (session?.user) {
      await signOut()
    } else {
      localStorage.removeItem('guest_profile')
      window.location.reload()
    }
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
            className="relative w-full max-w-sm bg-[#0c0c0e] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header / Avatar Area */}
            <div className="relative h-24 bg-gradient-to-r from-emerald-900/40 to-blue-900/40 border-b border-white/5 flex items-center justify-center">
              <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/60 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition">
                <X size={16} />
              </button>
              
              <div className="absolute -bottom-10 w-20 h-20 rounded-2xl bg-black border-[3px] border-[#0c0c0e] flex items-center justify-center shadow-xl">
                {session?.user?.image ? (
                  <img src={session.user.image} alt="Profile" className="w-full h-full rounded-xl object-cover" />
                ) : (
                  <User size={32} className="text-zinc-400" />
                )}
                {isPremium && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-black">
                    <Crown size={12} className="text-black" />
                  </div>
                )}
              </div>
            </div>

            <div className="pt-14 pb-6 px-6 flex flex-col items-center">
              {isLoggedIn ? (
                <>
                  <h2 className="text-xl font-bold text-white mb-1">
                    {session?.user?.name || guestProfile?.username}
                  </h2>
                  <p className="text-sm text-zinc-500 mb-6 flex items-center gap-1.5">
                    {session?.user?.email ? (
                      <><Mail size={12} /> {session.user.email}</>
                    ) : (
                      <><Clock size={12} /> Guest Session</>
                    )}
                  </p>

                  <div className="w-full space-y-2 mb-6">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-sm text-zinc-400">Plan</span>
                      <span className={cn(
                        "text-sm font-bold uppercase tracking-wider",
                        isPremium ? "text-emerald-400" : "text-zinc-300"
                      )}>
                        {isPremium ? 'Astra Pro' : 'Free'}
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition text-sm font-semibold"
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mb-3">
                    <ShieldAlert size={20} />
                  </div>
                  <h2 className="text-lg font-bold text-white mb-2">No Active Session</h2>
                  <p className="text-sm text-zinc-500 mb-6">
                    null
                  </p>
                  <button 
                    onClick={() => {
                      onClose()
                      window.location.reload()
                    }}
                    className="w-full py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition"
                  >
                    Go to Login
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
