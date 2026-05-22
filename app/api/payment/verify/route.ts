import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { connectToDatabase } from '@/lib/mongodb'
import { getServerSession } from 'next-auth'

export async function POST(req: NextRequest) {
  try {
    const { 
      razorpay_payment_id, 
      razorpay_order_id, 
      razorpay_signature, 
      plan, 
      guestId 
    } = await req.json()

    // Validate parameters
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !plan) {
      return NextResponse.json({ error: 'Missing payment verification parameters.' }, { status: 400 })
    }

    // 1. Verify the signature securely using HMAC-SHA256
    const secret = process.env.RAZORPAY_KEY_SECRET || ''
    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex')

    const isAuthentic = expectedSignature === razorpay_signature

    if (!isAuthentic) {
      return NextResponse.json({ error: 'Invalid payment signature. Transaction may have been tampered.' }, { status: 400 })
    }

    // 2. Signature is verified successfully. Update user plan in MongoDB.
    const session = await getServerSession()
    const { db } = await connectToDatabase()

    if (session?.user?.email) {
      await db.collection('users').updateOne(
        { email: session.user.email },
        { 
          $set: { 
            plan, 
            planUpdatedAt: Date.now(),
            lastPaymentId: razorpay_payment_id,
            lastOrderId: razorpay_order_id
          } 
        },
        { upsert: true }
      )
    } else if (guestId) {
      await db.collection('users').updateOne(
        { id: guestId },
        { 
          $set: { 
            plan, 
            planUpdatedAt: Date.now(),
            lastPaymentId: razorpay_payment_id,
            lastOrderId: razorpay_order_id
          } 
        }
      )
    } else {
      return NextResponse.json({ error: 'No user session or guest profile identified.' }, { status: 400 })
    }

    return NextResponse.json({ success: true, plan })
  } catch (error: any) {
    console.error('Payment Verification Error:', error)
    return NextResponse.json({ error: 'Payment verification failed. ' + (error.message || '') }, { status: 500 })
  }
}
