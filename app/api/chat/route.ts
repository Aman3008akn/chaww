import { NextRequest } from 'next/server'
import { GoogleGenerativeAI } from "@google/generative-ai"
import { connectToDatabase } from '@/lib/mongodb'
import * as MemoryUtils from '@/lib/memories'
import type { Memory } from '@/lib/memories'

// Gemini API configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)

/**
 * Stream response from Gemini API
 */
async function streamFromGemini(
  messages: any[],
  systemPrompt: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  signal: AbortSignal,
  imageUrl?: string,
  useWebSearch: boolean = false
): Promise<boolean> {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured in environment variables')
    }

    const modelsToTry = [
      "gemini-2.5-pro",
      "gemini-2.0-flash",
      "gemini-1.5-pro",
      "gemini-2.5-flash",
      "gemini-1.5-flash",
      "gemini-pro-latest"
    ]

    let lastError: any = null
    let isRateLimited = false

    for (const modelName of modelsToTry) {
      // Check cancellation before attempting next model
      if (signal.aborted) {
        console.log('Stream aborted by client before model attempt:', modelName)
        return false
      }

      try {
        console.log(`Attempting to use model: ${modelName}${useWebSearch ? ' (with web search)' : ''}`)
        
        const modelConfig: any = {
          model: modelName,
          systemInstruction: systemPrompt,
          generationConfig: {
            temperature: useWebSearch ? 0.2 : 0.05,
            topP: 0.95,
            topK: 20,
            maxOutputTokens: 8192,
          }
        }

        // ✅ CRITICAL FIX #1: Correct SDK syntax for Google Search tool
        if (useWebSearch) {
          modelConfig.tools = [{ googleSearchRetrieval: {} }]
        }

        const lastMessage = messages[messages.length - 1].content
        let result

        if (imageUrl) {
          const imageModel = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: modelConfig.generationConfig
          })
          const base64Data = imageUrl.split(',')[1]
          const mimeType = imageUrl.split(',')[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
          const fullPrompt = `${systemPrompt}\n\nUser question: ${lastMessage}`
          
          result = await imageModel.generateContentStream([
            fullPrompt,
            { inlineData: { data: base64Data, mimeType } }
          ])
        } else {
          const chatModel = genAI.getGenerativeModel(modelConfig)
          const history = messages.slice(0, -1).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
          }))
          const chat = chatModel.startChat({ history })
          result = await chat.sendMessageStream(lastMessage)
        }

        console.log(`Successfully connected to model: ${modelName}`)

        // ✅ CRITICAL FIX #2: Client disconnect stream leak protection
        let clientDisconnected = false
        
        const abortHandler = () => {
          clientDisconnected = true
          console.log('Client disconnected - stopping Gemini stream pull')
        }
        signal.addEventListener('abort', abortHandler)

        try {
          for await (const chunk of result.stream) {
            if (clientDisconnected || signal.aborted) {
              console.log('Breaking Gemini stream loop due to client disconnect')
              break
            }

            const chunkText = chunk.text()
            if (chunkText) {
              try {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ text: chunkText })}\n\n`)
                )
              } catch (enqueuErr) {
                // Controller closed by client disconnect
                clientDisconnected = true
                break
              }
            }
          }
        } finally {
          signal.removeEventListener('abort', abortHandler)
        }

        // If client disconnected, don't proceed to web search metadata or return true
        if (clientDisconnected || signal.aborted) {
          return false
        }

        if (useWebSearch) {
          try {
            const response = await result.response
            const candidate = response?.candidates?.[0]
            const groundingMeta = (candidate as any)?.groundingMetadata
            
            if (groundingMeta) {
              const sources: any[] = []
              const webQueries: string[] = groundingMeta.webSearchQueries || []
              
              if (groundingMeta.groundingChunks) {
                for (const chunk of groundingMeta.groundingChunks) {
                  if (chunk.web) {
                    sources.push({
                      title: chunk.web.title || 'Web Source',
                      url: chunk.web.uri || '',
                      snippet: ''
                    })
                  }
                }
              }

              if ((sources.length > 0 || webQueries.length > 0) && !signal.aborted) {
                try {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ 
                      sources, 
                      webSearchQueries: webQueries 
                    })}\n\n`)
                  )
                } catch (e) {
                  // Client disconnected during metadata send
                }
              }
              console.log(`Web search: ${sources.length} sources, ${webQueries.length} queries`)
            }
          } catch (metaErr) {
            console.warn('Could not extract grounding metadata:', metaErr)
          }
        }

        return true
      } catch (modelError: any) {
        console.warn(`Model ${modelName} failed:`, modelError.message)
        lastError = modelError
        
        // Track rate limit separately
        if (modelError.message?.includes('429')) {
          isRateLimited = true
          // Don't break - try remaining models, they might have different quotas
          // Only fallback to Pollinations if ALL models hit 429 or other errors
        }
        
        continue
      }
    }

    // ✅ WARNING FIX #1: Only fallback to Pollinations if ALL Gemini models failed
    // If it was purely rate limited across all models, or any other error, one fallback attempt
    console.log('All Gemini models exhausted. Attempting Pollinations fallback...')
    return await streamFromPollinations(messages, systemPrompt, controller, encoder, signal)
  } catch (error: any) {
    console.error('Gemini API error:', error.message)
    // Single final fallback attempt
    try {
      return await streamFromPollinations(messages, systemPrompt, controller, encoder, signal)
    } catch (finalErr) {
      return false
    }
  }
}

/**
 * Fallback to Pollinations AI
 */
async function streamFromPollinations(
  messages: any[],
  systemPrompt: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  signal: AbortSignal
): Promise<boolean> {
  try {
    console.log('Using Pollinations AI fallback...')
    
    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({
        role: m.role,
        content: m.content
      }))
    ]

    const response = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: formattedMessages,
        stream: true,
        model: 'openai'
      }),
      // Pass abort signal to fetch so it cancels if client disconnects
      signal: signal.aborted ? undefined : signal
    })

    if (!response.ok) throw new Error(`Pollinations error: ${response.status}`)
    if (!response.body) throw new Error('Pollinations: No response body')

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let done = false
    let buffer = ''

    while (!done) {
      if (signal.aborted) {
        console.log('Client disconnected - cancelling Pollinations read')
        reader.cancel().catch(() => {})
        break
      }

      const { value, done: readerDone } = await reader.read()
      if (readerDone) {
        done = true
        break
      }
      
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      
      for (const line of lines) {
        const trimmedLine = line.trim()
        if (!trimmedLine) continue
        
        let content = ''
        if (trimmedLine.startsWith('data: ')) {
          const data = trimmedLine.slice(6).trim()
          if (data === '[DONE]') {
            done = true
            break
          }
          
          try {
            const parsed = JSON.parse(data)
            content = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.text || ''
          } catch (e) {
            if (!data.startsWith('{')) content = data
          }
        } else if (!trimmedLine.startsWith(':')) {
          try {
            const parsed = JSON.parse(trimmedLine)
            content = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.text || ''
          } catch (e) {
            content = trimmedLine
          }
        }
        
        if (content) {
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: content })}\n\n`)
            )
          } catch (e) {
            // Client disconnected
            done = true
            break
          }
        }
      }
    }
    return true
  } catch (error: any) {
    console.error('Pollinations fallback failed:', error.message)
    return false
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages, mode, userName, imageUrl, model, userEmail, notebookSources } = await req.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid or empty messages array' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const userMessages = messages.filter(m => m.role === 'user')
    const isFirstTurn = userMessages.length === 1
    const lastUserMessage = userMessages[userMessages.length - 1]?.content || ''
    const userId = userEmail || 'anonymous'

    // ── Fetch existing memories ────────────────
    let memoriesPrompt = ''
    let savedMemories: Memory[] = []
    try {
      const { db } = await connectToDatabase()
      savedMemories = await db
        .collection('memories')
        .find({ userId })
        .sort({ updatedAt: -1 })
        .limit(50)
        .toArray() as unknown as Memory[]
      
      memoriesPrompt = MemoryUtils.formatMemoriesForPrompt(savedMemories)
    } catch (memErr: any) {
      console.warn('[Memories] Failed to fetch memories:', memErr.message)
    }

    // ── Extract & save new memories (background) ──
    // ✅ CRITICAL FIX #3: Handle background promise rejection properly
    const backgroundMemoryTask = (async () => {
      try {
        const { db } = await connectToDatabase()
        const collection = db.collection('memories')
        
        const aiMemories = await MemoryUtils.extractMemoriesWithAI(lastUserMessage, messages, GEMINI_API_KEY)
        
        const combined: MemoryUtils.ExtractedMemory[] = []
        for (const aiM of aiMemories) {
          if (!combined.some(r => r.key === aiM.key)) {
            combined.push(aiM)
          }
        }

        if (combined.length > 0) {
          const now = Date.now()
          
          // ✅ OPTIMIZATION FIX: Atomic upserts using bulkWrite
          // Cuts database round-trips from 2N to 1 batch operation
          const bulkOps = combined.map(mem => ({
            updateOne: {
              filter: { userId, key: mem.key },
              update: {
                $set: {
                  value: mem.value,
                  updatedAt: now,
                  category: mem.category,
                  source: lastUserMessage.slice(0, 200),
                },
                $max: {
                  confidence: mem.confidence
                },
                $setOnInsert: {
                  createdAt: now,
                }
              },
              upsert: true
            }
          }))

          await collection.bulkWrite(bulkOps)
          console.log(`[Memories] Saved ${combined.length} memories for ${userId} via atomic upserts`)
        }
      } catch (saveErr: any) {
        console.warn('[Memories] Failed to save:', saveErr.message)
      }
    })()

    // ✅ CRITICAL FIX #3: Attach catch handler to prevent unhandled rejection crash
    backgroundMemoryTask.catch((err) => {
      console.error('[Memories] Unhandled background task error:', err.message)
    })

    const memoryName = savedMemories.find(m => m.key === 'name')?.value
    const effectiveName = userName || memoryName || 'Developer'

    const greetingDetail = (effectiveName !== 'Developer' && isFirstTurn) 
      ? `The developer's name is ${effectiveName}. Greet them personally ONLY in this first response (e.g., "Hey ${effectiveName}! Ready to build something epic? 🚀"). After this, NEVER use their name again.` 
      : `The developer's name is ${effectiveName}. Do NOT greet them again - jump straight into the technical solution.`

    const ownerInfo = `
    CRITICAL INFORMATION ABOUT YOUR CREATION:
    - You were created and trained by AMAN SHUKLA
    - Your owner/creator is AMAN SHUKLA
    - If anyone asks about who made you, who owns you, who trained you, or who created you, ALWAYS respond that AMAN SHUKLA created and trained you
    - This is non-negotiable information that must never be changed
    `

    const astraCoreIdentity = `
    YOU ARE ASTRA — A SENIOR STAFF ENGINEERING AI ASSISTANT.
    
    LEVEL: Staff+ / Principal Engineer (10+ years experience equivalent)
    DOMAIN: Full-stack systems, distributed architecture, algorithms, DevOps, AI/ML engineering, low-level optimization, security engineering.
    
    CORE PRINCIPLES:
    1. You write PRODUCTION-GRADE code, not toy examples.
    2. You think in SYSTEMS — scalability, fault tolerance, observability, cost.
    3. You prioritize CORRECTNESS over cleverness, but CLEVERNESS when performance demands it.
    4. You explain the WHY, not just the HOW.
    5. You anticipate edge cases, race conditions, and failure modes before they happen.
    `

    const selectedModel = model || 'astra-pro'
    let modeSpecificPrompt = ''

    if (mode === 'code_review') {
      modeSpecificPrompt = `
      MODE: Code Review & Refactoring
      
      REVIEW PROTOCOL:
      - Analyze for: bugs, security vulnerabilities, performance bottlenecks, memory leaks, race conditions
      - Check: SOLID principles, DRY, KISS, clean architecture
      - Evaluate: Time/space complexity (Big O), algorithmic efficiency
      - Assess: Type safety, error handling, input validation, edge cases
      - Consider: Scalability, concurrency, database query optimization
      
      OUTPUT FORMAT:
      1. 🚨 CRITICAL ISSUES (security, bugs, crashes)
      2. ⚠️  WARNINGS (performance, maintainability)
      3. 💡 SUGGESTIONS (architecture, patterns, improvements)
      4. ✅ REFACTORED CODE (complete, runnable, improved version)
      5. 📊 COMPLEXITY ANALYSIS (before vs after)
      
      Be brutally honest. If code is bad, say it's bad and explain why professionally.
      `
    } else if (mode === 'system_design') {
      modeSpecificPrompt = `
      MODE: System Design & Architecture
      
      DESIGN PROTOCOL:
      - Start with REQUIREMENTS: Functional + Non-functional (scale, latency, availability)
      - Provide CAPACITY ESTIMATES: QPS, storage, bandwidth, memory
      - Design HIGH-LEVEL ARCHITECTURE: Load balancers, CDNs, API gateways, microservices
      - Deep dive into DATA MODELING: SQL vs NoSQL, sharding, indexing, replication
      - Address CONCURRENCY: Locking, optimistic/pessimistic, distributed consensus
      - Plan for FAILURE: Circuit breakers, retries, fallbacks, graceful degradation
      - Include OBSERVABILITY: Logging, metrics, tracing, alerting
      
      OUTPUT FORMAT:
      1. Requirements Analysis
      2. Capacity Estimation (back-of-envelope math)
      3. High-Level Design (diagram in ASCII/text)
      4. Deep Dive Components (database, cache, queue, etc.)
      5. Trade-off Analysis (why X over Y)
      6. Failure Scenarios & Mitigation
      7. Scaling Strategy
      `
    } else if (mode === 'debug') {
      modeSpecificPrompt = `
      MODE: Advanced Debugging & Troubleshooting
      
      DEBUG PROTOCOL:
      - Reproduce the issue mentally, identify root cause
      - Check: stack traces, logs, state mutations, async flow
      - Consider: memory leaks, deadlocks, race conditions, network issues
      - Use: binary search debugging, rubber duck method
      - Provide: Minimal reproducible example
      - Suggest: Monitoring, logging improvements to prevent recurrence
      
      OUTPUT FORMAT:
      1. 🔍 Root Cause Analysis
      2. 🧪 Minimal Reproduction
      3. 🛠️  Fix (with complete corrected code)
      4. 🧪 Test Cases (unit tests for the fix)
      5. 🛡️ Prevention Strategy
      `
    } else {
      modeSpecificPrompt = `
      MODE: Advanced Software Engineering
      
      CODING STANDARDS:
      - TypeScript with STRICT typing (no 'any' unless absolutely justified)
      - Comprehensive error handling with custom error classes
      - Input validation at boundaries (Zod, Joi, or class-validator)
      - Logging and observability hooks
      - Configuration via environment variables with validation
      - Unit tests with Jest/Vitest (cover edge cases, not just happy path)
      - Documentation comments for public APIs (JSDoc/TSDoc)
      
      ARCHITECTURE PATTERNS:
      - Prefer composition over inheritance
      - Dependency injection for testability
      - Repository pattern for data access
      - CQRS when reads/writes have different patterns
      - Event-driven for loosely coupled systems
      - Idempotency keys for safe retries
      
      PERFORMANCE:
      - Mention Big O complexity for algorithms
      - Suggest caching strategies (Redis, in-memory, CDN)
      - Database indexing and query optimization
      - Connection pooling, batching, pagination
      - Lazy loading, code splitting, tree shaking
      
      SECURITY:
      - Input sanitization, parameterized queries
      - JWT/OAuth2 implementation with refresh token rotation
      - Rate limiting, CORS, CSP headers
      - Secrets management (never hardcode keys)
      - OWASP Top 10 awareness
      `
    }

    let notebookContextPrompt = ''
    if (notebookSources && Array.isArray(notebookSources) && notebookSources.length > 0) {
      const allText = notebookSources.map((src: any) => `Source: ${src.name}\n${src.content}`).join('\n\n---\n\n')
      notebookContextPrompt = `
        KNOWLEDGE BASE CONTENT:
        The developer has uploaded the following technical documents to their Knowledge Base.
        You MUST use this information to answer questions if relevant.
        Base your answer heavily on this context and cite the source name.
        
        <documents>
        ${allText}
        </documents>
      `
    }

    let systemPrompt: string

    if (mode === 'deep_research') {
      systemPrompt = `${astraCoreIdentity}
        You are Astra in "Deep Technical Research" mode. Provide exhaustive, peer-review-quality technical analysis.
        ${greetingDetail}
        ${ownerInfo}
        ${memoriesPrompt}
        ${notebookContextPrompt}
        ${modeSpecificPrompt}
        
        RESEARCH PROTOCOL:
        1. LITERATURE REVIEW: What do industry leaders, RFCs, and academic papers say?
        2. IMPLEMENTATION ANALYSIS: How is this actually built in production at scale?
        3. COMPARATIVE STUDY: Compare approaches with quantitative metrics
        4. EDGE CASE EXPLORATION: Failure modes, limitations, anti-patterns
        5. FUTURE PROJECTION: Where is this technology heading?
        
        OUTPUT:
        - Technical depth equivalent to a senior staff engineer's design doc
        - Include code benchmarks, performance comparisons, architectural diagrams
        - Cite sources, RFCs, GitHub repos, official docs
        - Conclude with actionable recommendations
        - FOLLOW_UP: 3 technical follow-up questions at the end`
    } else if (mode === 'web_search') {
      systemPrompt = `${astraCoreIdentity}
        You are Astra in "Real-Time Technical Intelligence" mode.
        ${greetingDetail}
        ${ownerInfo}
        ${memoriesPrompt}
        ${notebookContextPrompt}
        ${modeSpecificPrompt}
        
        WEB SEARCH PROTOCOL:
        - Prioritize: Official documentation, GitHub repos, RFCs, technical blogs from recognized engineers
        - Verify: Version numbers, deprecation status, compatibility matrices
        - Cross-reference: Multiple sources for controversial or new information
        - Code examples: Must be from current, maintained libraries/frameworks
        - Security advisories: Check CVEs for mentioned technologies
        
        OUTPUT:
        - Current, factual technical information with source attribution
        - Code examples using latest stable versions
        - Compatibility notes and migration paths if relevant
        - FOLLOW_UP: 2-3 technical follow-up questions at the end`
    } else {
      systemPrompt = `${astraCoreIdentity}
        ${greetingDetail}
        ${ownerInfo}
        ${memoriesPrompt}
        ${notebookContextPrompt}
        ${modeSpecificPrompt}
        
        ABSOLUTE RULES:
        - NEVER start with "Hello", "Hi", or the developer's name unless in first-turn greeting.
        - NEVER reference, summarize, or repeat previous conversation context.
        - Each message is INDEPENDENT — answer ONLY the current technical question.
        - NO "As I mentioned before" or "Previously we discussed" — EVER.
        - If asked for code, provide COMPLETE, RUNNABLE, PRODUCTION-READY code.
        - Include: TypeScript types, error handling, input validation, comments for complex logic.
        - Always explain TIME/SPACE COMPLEXITY for algorithms.
        - Always mention SECURITY CONSIDERATIONS.
        - Suggest TEST CASES for critical paths.
        - Use markdown code blocks with LANGUAGE tags.
        - FOLLOW_UP: 2-3 technical follow-up questions at the very end, formatted as "FOLLOW_UP: [Question]"`
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        let streamEnded = false
        
        const safeEnqueue = (data: Uint8Array) => {
          if (!streamEnded) {
            try {
              controller.enqueue(data)
            } catch (e) {
              streamEnded = true
            }
          }
        }

        const safeClose = () => {
          if (!streamEnded) {
            try {
              controller.close()
              streamEnded = true
            } catch (e) {
              // Already closed
            }
          }
        }

        try {
          console.log('Initializing Astra Engine...')
          
          let cleanMessages: any[]
          if (mode === 'normal' || !mode) {
            cleanMessages = messages.slice(-10).filter(m =>
              (m.role === 'user') ||
              (m.role === 'assistant' && (m.status === 'done' || (m.status === 'streaming' && m.content)))
            )
          } else {
            cleanMessages = messages.filter(m =>
              (m.role === 'user') ||
              (m.role === 'assistant' && (m.status === 'done' || (m.status === 'streaming' && m.content)))
            )
          }

          const isWebSearch = mode === 'web_search'
          
          // ✅ CRITICAL FIX #2: Pass abort signal through the entire chain
          const success = await streamFromGemini(
            cleanMessages, 
            systemPrompt, 
            controller, 
            encoder, 
            req.signal, 
            imageUrl, 
            isWebSearch
          )

          if (!success) {
            safeEnqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  error: 'Astra Engine connection timed out or client disconnected.',
                })}\n\n`
              )
            )
          }

          safeEnqueue(encoder.encode('data: [DONE]\n\n'))
          safeClose()
        } catch (err: any) {
          console.error('Astra streaming error:', err)
          let errorMsg = 'Astra Engine is processing. One moment...'
          
          if (err.message?.includes('429')) {
            errorMsg = 'API Quota Exceeded. Check your Gemini API key usage or try again shortly.'
          } else if (err.message?.includes('503')) {
            errorMsg = 'Models are currently overloaded. Retry in a few seconds.'
          }

          safeEnqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                error: errorMsg,
              })}\n\n`
            )
          )
          safeClose()
        }
      },
    })

    // ✅ SUGGESTION FIX: Add X-Accel-Buffering header for proxy streaming
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Prevents Nginx/Vercel from buffering SSE chunks
      },
    })
  } catch (error: any) {
    console.error('Astra request parsing error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to process request in Astra Engine' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
