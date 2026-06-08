import { MongoClient, Db } from 'mongodb'

const uri = process.env.MONGODB_URI || ''
let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null

export async function connectToDatabase() {
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is missing or empty')
  }

  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb }
  }

  try {
    const client = new MongoClient(uri)
    await client.connect()
    
    const db = client.db('nexusai')
    
    cachedClient = client
    cachedDb = db
    
    return { client, db }
  } catch (error: any) {
    console.error('MongoDB connection error:', error.message)
    if (error.message.includes('bad auth')) {
      console.error('Authentication failed. Please check your MongoDB credentials in .env.local')
      console.error('Verify that the username and password are correct and the user has proper permissions.')
    }
    throw error
  }
}

export async function getConversationsCollection() {
  const { db } = await connectToDatabase()
  return db.collection('conversations')
}

export async function getMessagesCollection() {
  const { db } = await connectToDatabase()
  return db.collection('messages')
}

export async function closeConnection() {
  if (cachedClient) {
    await cachedClient.close()
    cachedClient = null
    cachedDb = null
  }
}
