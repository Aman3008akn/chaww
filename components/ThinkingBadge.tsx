'use client'

import { useEffect, useState } from 'react'
import { Check, Loader2, Circle } from 'lucide-react'
import type { Message } from '@/lib/types'

interface Props {
  message?: Message
}

const THOUGHTS = [
  'Thinking',
  'Analyzing',
  'Reasoning',
  'Synthesizing',
  'Finalizing',
]

export default function ThinkingBadge({ message }: Props) {
  const [idx, setIdx] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const steps = message?.thinkingSteps || []
  const doneCount = steps.filter(s => s.status === 'done').length
  const progress = steps.length > 0 ? (doneCount / steps.length) * 100 : 0

  // Cycle thought labels
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % THOUGHTS.length), 3000)
    return () => clearInterval(t)
  }, [])

  // Elapsed timer
  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`
  }

  return (
    <div className="flex items-start gap-3 msg-enter mb-5 select-none">
      {/* ─── Icon ─── */}
      <div className="relative w-7 h-7 shrink-0 mt-0.5 flex items-center justify-center">
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 28 28">
          <circle cx="14" cy="14" r="12" fill="none" stroke="rgba(120,120,120,0.15)" strokeWidth="1.5" />
          <circle
            cx="14" cy="14" r="12"
            fill="none"
            stroke="rgba(120,120,120,0.5)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray={`${progress * 0.754} 75.4`}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <Loader2 size={14} className="text-neutral-400 animate-spin" strokeWidth={1.5} />
      </div>

      {/* ─── Content ─── */}
      <div className="flex-1 flex flex-col gap-2.5 pt-0.5 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-neutral-400 font-normal tracking-tight">
            {THOUGHTS[idx]}
          </span>
          {/* Bouncing dots */}
          <span className="flex gap-[3px] items-end h-3">
            <span className="w-[3px] h-[3px] rounded-full bg-neutral-500 animate-[bounce_1.4s_infinite]" style={{ animationDelay: '0ms' }} />
            <span className="w-[3px] h-[3px] rounded-full bg-neutral-500 animate-[bounce_1.4s_infinite]" style={{ animationDelay: '200ms' }} />
            <span className="w-[3px] h-[3px] rounded-full bg-neutral-500 animate-[bounce_1.4s_infinite]" style={{ animationDelay: '400ms' }} />
          </span>
          <span className="text-[11px] text-neutral-600 font-mono ml-auto tabular-nums">
            {formatTime(elapsed)}
          </span>
        </div>

        {/* ─── Steps ─── */}
        {steps.length > 0 ? (
          <div className="relative flex flex-col gap-1 pl-1">
            {/* Subtle connecting line */}
            <div className="absolute left-[7px] top-1.5 bottom-2 w-px bg-neutral-800">
              <div
                className="w-full bg-neutral-600 transition-all duration-500 ease-out"
                style={{ height: `${progress}%` }}
              />
            </div>

            {steps.map((step, i) => {
              const isDone = step.status === 'done'
              const isActive = step.status === 'active'

              return (
                <div
                  key={step.id}
                  className="relative flex items-center gap-2.5"
                  style={{ animation: `fadeSlide 0.4s ease-out ${i * 80}ms both` }}
                >
                  {/* Node */}
                  <div className="relative z-10 shrink-0">
                    {isDone ? (
                      <div className="w-[14px] h-[14px] rounded-full bg-neutral-700 flex items-center justify-center">
                        <Check size={8} strokeWidth={2.5} className="text-neutral-300" />
                      </div>
                    ) : isActive ? (
                      <div className="w-[14px] h-[14px] rounded-full border border-neutral-600 flex items-center justify-center">
                        <div className="w-[6px] h-[6px] rounded-full bg-neutral-400 animate-pulse" />
                      </div>
                    ) : (
                      <div className="w-[14px] h-[14px] rounded-full border border-neutral-800 flex items-center justify-center">
                        <Circle size={5} className="text-neutral-700" />
                      </div>
                    )}
                  </div>

                  {/* Label */}
                  <span className={`text-[12px] transition-colors duration-300 ${
                    isDone
                      ? 'text-neutral-500 line-through decoration-neutral-700'
                      : isActive
                        ? 'text-neutral-300'
                        : 'text-neutral-700'
                  }`}>
                    {step.label}
                  </span>
                </div>
              )
            })}

            {/* Footer */}
            <div className="mt-1 flex items-center gap-2 text-[10px] text-neutral-700">
              <span>{doneCount} of {steps.length}</span>
              <div className="flex-1 h-px bg-neutral-800" />
              <div className="flex gap-[3px]">
                {steps.map((s, i) => (
                  <div
                    key={i}
                    className={`w-[3px] h-[3px] rounded-full transition-colors duration-300 ${
                      s.status === 'done' ? 'bg-neutral-500' :
                      s.status === 'active' ? 'bg-neutral-400 animate-pulse' :
                      'bg-neutral-800'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Skeleton */
          <div className="flex flex-col gap-2 pl-1">
            {[40, 56, 32].map((w, i) => (
              <div
                key={i}
                className="h-2 rounded-full bg-neutral-800/60 relative overflow-hidden"
                style={{ width: `${w}%` }}
              >
                <div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-neutral-700/30 to-transparent animate-[shimmer_2s_infinite]"
                  style={{ backgroundSize: '200% 100%', animationDelay: `${i * 0.15}s` }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateX(-6px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}
