import { NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { getServerSession } from 'next-auth'

export async function POST(req: NextRequest) {
  try {
    const { plan, guestId } = await req.json()
    const session = await getServerSession()
    
    if (!session?.user?.email && !guestId) {
      return new Response(JSON.stringify({ error: 'Unauthorized. Please login or start a guest session.' }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' } 
      })
    }

    // Validate plan
    if (!['free', 'pro', 'max'].includes(plan)) {
      return new Response(JSON.stringify({ error: 'Invalid plan selected.' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      })
    }

    const { db } = await connectToDatabase()
    
    if (session?.user?.email) {
      await db.collection('users').updateOne(
        { email: session.user.email },
        { $set: { plan, planUpdatedAt: Date.now() } },
        { upsert: true }
      )
    } else if (guestId) {
      await db.collection('users').updateOne(
        { id: guestId },
        { $set: { plan, planUpdatedAt: Date.now() } }
      )
    }

    return new Response(JSON.stringify({ success: true, plan }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    })
  } catch (error) {
    console.error('Upgrade Error:', error)
    return new Response(JSON.stringify({ error: 'Failed to process upgrade. Internal Server Error.' }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const guestId = searchParams.get('guestId')
    const session = await getServerSession()

    if (!session?.user?.email && !guestId) {
      return new Response(JSON.stringify({ plan: 'free' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }

    const { db } = await connectToDatabase()
    let user = null

    if (session?.user?.email) {
      user = await db.collection('users').findOne({ email: session.user.email })
    } else if (guestId) {
      user = await db.collection('users').findOne({ id: guestId })
    }

    return new Response(JSON.stringify({ plan: user?.plan || 'free' }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    })
  } catch (error) {
    return new Response(JSON.stringify({ plan: 'free' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }
}
