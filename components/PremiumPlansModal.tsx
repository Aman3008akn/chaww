'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Sparkles, Zap, Crown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSession } from 'next-auth/react'

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false)
      return
    }
    if ((window as any).Razorpay) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function PremiumPlansModal({ isOpen, onClose }: Props) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState(false)
  const { data: session } = useSession()
  const isPremium = typeof window !== 'undefined' ? localStorage.getItem('astra_premium') === 'true' : false

  const plans = [
    {
      name: 'Free',
      price: '₹0',
      description: 'Perfect for casual users who just need quick answers.',
      icon: <Zap className="text-zinc-400" size={24} />,
      color: 'bg-zinc-800/50 border-zinc-700',
      features: [
        'Base AI Models (Flash)',
        'Standard Response Speed',
        'Up to 3 Notebook Uploads',
        'Basic Chat History'
      ],
      notIncluded: [
        'Deep Research Mode',
        'Web Search Integration',
        'AI Image Generation'
      ],
      buttonText: isPremium ? 'Downgrade' : 'Current Plan',
      isCurrent: !isPremium
    },
    {
      name: 'Astra Pro',
      price: billingCycle === 'monthly' ? '₹899' : '₹749',
      period: '/mo',
      description: 'For professionals needing deeper context and advanced tools.',
      icon: <Sparkles className="text-emerald-400" size={24} />,
      color: 'bg-gradient-to-b from-emerald-950/40 to-black border-emerald-500/30',
      glow: 'shadow-[0_0_40px_rgba(52,211,153,0.15)]',
      popular: true,
      features: [
        'Advanced Models (Pro/Opus)',
        'Priority Response Speed',
        'Deep Research Mode Unlocked',
        'Web Search Integration',
        'Unlimited Notebook Uploads',
        '100 Image Generations/mo'
      ],
      notIncluded: [
        'API Access'
      ],
      buttonText: isPremium ? 'Current Plan' : 'Upgrade to Pro',
      isCurrent: isPremium
    },
    {
      name: 'Astra Max',
      price: billingCycle === 'monthly' ? '₹1999' : '₹1599',
      period: '/mo',
      description: 'The ultimate AI workstation with zero compromises.',
      icon: <Crown className="text-amber-400" size={24} />,
      color: 'bg-zinc-900 border-amber-500/20',
      features: [
        'Everything in Pro',
        'Uncapped Image Generation',
        'Custom Team Workspaces',
        'Developer API Access',
        '24/7 Priority Support'
      ],
      notIncluded: [],
      buttonText: 'Get Max',
      isCurrent: false
    }
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 md:p-12">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative w-full max-w-6xl bg-[#0c0c0e] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="relative px-4 sm:px-8 pt-8 sm:pt-12 pb-6 sm:pb-8 text-center shrink-0">
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition z-10"
              >
                <X size={20} />
              </button>
              
              <h2 className="text-2xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 tracking-tight mb-2 sm:mb-4">
                Unlock the Power of Astra AI
              </h2>
              <p className="text-zinc-400 text-sm sm:text-lg max-w-2xl mx-auto mb-6 sm:mb-8">
                Experience unprecedented intelligence with deeper reasoning, real-time web search, and limitless knowledge bases.
              </p>

              {/* Billing Toggle */}
              <div className="inline-flex items-center p-1 bg-white/5 rounded-full border border-white/10 relative">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={cn(
                    "relative px-6 py-2 text-sm font-medium rounded-full transition-colors z-10",
                    billingCycle === 'monthly' ? "text-black" : "text-zinc-400 hover:text-white"
                  )}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={cn(
                    "relative px-6 py-2 text-sm font-medium rounded-full transition-colors z-10",
                    billingCycle === 'yearly' ? "text-black" : "text-zinc-400 hover:text-white"
                  )}
                >
                  Yearly <span className="ml-1 text-emerald-600 font-bold">-20%</span>
                </button>
                
                {/* Sliding Background */}
                <div 
                  className={cn(
                    "absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-full transition-all duration-300 ease-in-out",
                    billingCycle === 'monthly' ? "left-1" : "left-[calc(50%+3px)]"
                  )} 
                />
              </div>
            </div>

            {/* Plans Grid */}
            <div className="px-4 sm:px-8 pb-8 sm:pb-12 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan, i) => (
                  <div 
                    key={plan.name}
                    className={cn(
                      "relative rounded-2xl border p-6 flex flex-col",
                      plan.color,
                      plan.glow
                    )}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-400 to-emerald-600 text-black text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                        Most Popular
                      </div>
                    )}

                    <div className="mb-4">
                      {plan.icon}
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                    <p className="text-sm text-zinc-400 mb-6 min-h-[40px]">{plan.description}</p>
                    
                    <div className="mb-6">
                      <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                      {plan.period && <span className="text-zinc-400">{plan.period}</span>}
                      {billingCycle === 'yearly' && plan.price !== '₹0' && (
                        <div className="text-xs text-emerald-400 font-medium mt-1">Billed annually</div>
                      )}
                    </div>

                    <button 
                      onClick={async () => {
                        if (!plan.isCurrent && !loading) {
                          try {
                            setLoading(true)
                            
                            const guestRaw = localStorage.getItem('guest_profile')
                            const guestId = guestRaw ? JSON.parse(guestRaw).id : null

                            const rawPlanName = plan.name === 'Free' ? 'free' : plan.name.includes('Pro') ? 'pro' : 'max'

                            if (!session?.user && !guestId) {
                              alert('Please sign in or start a guest session to upgrade.')
                              setLoading(false)
                              return
                            }

                            // If downgrading to Free, use the simple mockup API
                            if (rawPlanName === 'free') {
                              const res = await fetch('/api/upgrade', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ plan: rawPlanName, guestId })
                              })

                              if (res.ok) {
                                localStorage.setItem('astra_premium', 'false')
                                alert(`Plan downgraded to Free.`)
                                onClose()
                                window.location.reload()
                              } else {
                                const errorData = await res.json()
                                alert(`Failed to downgrade: ${errorData.error}`)
                              }
                              setLoading(false)
                              return
                            }

                            // Load the Razorpay Checkout SDK script dynamically
                            const loaded = await loadRazorpayScript()
                            if (!loaded) {
                              alert('Failed to load payment gateway. Please check your internet connection and try again.')
                              setLoading(false)
                              return
                            }

                            // 1. Create a secure payment order via our backend
                            const orderRes = await fetch('/api/payment/create-order', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ plan: rawPlanName, billingCycle, guestId })
                            })

                            if (!orderRes.ok) {
                              const errData = await orderRes.json()
                              alert(`Failed to initiate payment: ${errData.error}`)
                              setLoading(false)
                              return
                            }

                            const orderData = await orderRes.json()

                            // 2. Open the Razorpay Overlay Checkout Modal
                            const options = {
                              key: orderData.keyId,
                              amount: orderData.amount,
                              currency: orderData.currency,
                              name: 'Astra AI',
                              description: `Upgrade to ${plan.name} (${billingCycle})`,
                              order_id: orderData.orderId,
                              handler: async function (response: any) {
                                try {
                                  setLoading(true)
                                  
                                  // 3. Send signature verification details to backend
                                  const verifyRes = await fetch('/api/payment/verify', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      razorpay_payment_id: response.razorpay_payment_id,
                                      razorpay_order_id: response.razorpay_order_id,
                                      razorpay_signature: response.razorpay_signature,
                                      plan: rawPlanName,
                                      guestId
                                    })
                                  })

                                  if (verifyRes.ok) {
                                    localStorage.setItem('astra_premium', 'true')
                                    alert(`Successfully upgraded to ${plan.name}!`)
                                    onClose()
                                    window.location.reload()
                                  } else {
                                    const errorData = await verifyRes.json()
                                    alert(`Payment verification failed: ${errorData.error}`)
                                    setLoading(false)
                                  }
                                } catch (err) {
                                  alert('An error occurred during payment verification.')
                                  setLoading(false)
                                }
                              },
                              prefill: {
                                name: session?.user?.name || '',
                                email: session?.user?.email || '',
                              },
                              theme: {
                                color: '#10b981', // Beautiful emerald color matching Astra Pro/Max designs
                              },
                              modal: {
                                ondismiss: function() {
                                  setLoading(false)
                                }
                              }
                            }

                            const paymentObject = new (window as any).Razorpay(options)
                            paymentObject.open()
                          } catch (err) {
                            alert('An error occurred during payment setup.')
                            setLoading(false)
                          }
                        }
                      }}
                      className={cn(
                        "w-full py-3 rounded-xl font-semibold text-sm transition-all mb-8",
                        plan.isCurrent 
                          ? "bg-white/10 text-white cursor-default" 
                          : plan.popular
                            ? "bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(52,211,153,0.3)]"
                            : "bg-white text-black hover:bg-zinc-200"
                      )}
                    >
                      {plan.buttonText}
                    </button>

                    <div className="space-y-3 mt-auto">
                      {plan.features.map(feature => (
                        <div key={feature} className="flex items-start gap-3">
                          <div className="mt-0.5 rounded-full bg-emerald-500/20 p-0.5 shrink-0">
                            <Check size={12} className="text-emerald-400" />
                          </div>
                          <span className="text-sm text-zinc-300">{feature}</span>
                        </div>
                      ))}
                      {plan.notIncluded.map(feature => (
                        <div key={feature} className="flex items-start gap-3 opacity-50">
                          <div className="mt-0.5 p-0.5 shrink-0">
                            <X size={12} className="text-zinc-500" />
                          </div>
                          <span className="text-sm text-zinc-500 line-through">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Footer */}
            <div className="bg-white/5 border-t border-white/5 px-4 sm:px-8 py-3 sm:py-4 text-center shrink-0">
              <p className="text-[10px] sm:text-xs text-zinc-500">
                Prices shown in INR (₹). Subscriptions can be cancelled at any time. For enterprise inquiries, please contact our sales team.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
