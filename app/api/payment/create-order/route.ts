import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function POST(req: NextRequest) {
  try {
    const keyId = (process.env.RAZORPAY_KEY_ID || '').trim()
    const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim()

    // Debug log to verify keys are loaded (remove after testing)
    console.log('Razorpay Key ID loaded:', keyId ? `${keyId.substring(0, 10)}...` : 'MISSING')
    console.log('Razorpay Key Secret loaded:', keySecret ? 'YES (length=' + keySecret.length + ')' : 'MISSING')

    if (!keyId || !keySecret) {
      return NextResponse.json({ error: 'Payment gateway not configured. Missing API keys.' }, { status: 500 })
    }

    const { plan, billingCycle, guestId } = await req.json()
    const session = await getServerSession()

    if (!session?.user?.email && !guestId) {
      return NextResponse.json({ error: 'Unauthorized. Please login or start a guest session.' }, { status: 401 })
    }

    if (!['pro', 'max'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan selected.' }, { status: 400 })
    }

    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return NextResponse.json({ error: 'Invalid billing cycle.' }, { status: 400 })
    }

    // Secure server-side pricing in paise (1 INR = 100 paise)
    let amount = 0
    if (plan === 'pro') {
      amount = billingCycle === 'monthly' ? 89900 : 898800
    } else if (plan === 'max') {
      amount = billingCycle === 'monthly' ? 199900 : 1918800
    }

    // Use Razorpay REST API directly with Basic Auth (more reliable than SDK)
    const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64')

    const razorpayRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency: 'INR',
        receipt: `rcpt_${plan}_${billingCycle}_${Date.now()}`,
        notes: {
          plan,
          billingCycle,
          guestId: guestId || '',
          userEmail: session?.user?.email || '',
        }
      })
    })

    if (!razorpayRes.ok) {
      const errBody = await razorpayRes.json()
      console.error('Razorpay API Error:', errBody)
      return NextResponse.json({ error: 'Razorpay order failed: ' + (errBody?.error?.description || 'Unknown error') }, { status: 500 })
    }

    const order = await razorpayRes.json()

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: keyId
    })
  } catch (error: any) {
    console.error('Razorpay Create Order Error:', error)
    return NextResponse.json({ error: 'Failed to initiate payment. ' + (error.message || '') }, { status: 500 })
  }
}

