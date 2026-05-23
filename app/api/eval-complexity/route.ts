import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Evaluates if a user query requires deep thinking/step-by-step reasoning.
 * Returns { isComplex: boolean } to trigger thinking UI in frontend.
 */
export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ isComplex: false });
    }

    const q = query.trim();

    // ── Fast-path: Explicit Thinking Commands (Trigger Thinking Mode Always) ──
    const explicitThinkingPattern = /\b(think|thinking|soch|socho|reasoning|deep\s*think|step\s*by\s*step)\b|think\s*kr|thinking\s*kr|think\s*karo/i;
    if (explicitThinkingPattern.test(q)) {
      return NextResponse.json({ isComplex: true });
    }

    // ── Fast-path: Simple patterns that NEVER need thinking ──
    const simplePatterns = [
      /^\s*(hi|hello|hey|yo|hola|namaste)\s*$/i,                          // Greetings only
      /^\s*(ok|okay|thanks|thank you|bye|goodbye|see ya)\s*$/i,           // Acknowledgments
      /^\s*(yes|no|maybe|sure|nope|yeah)\s*$/i,                           // One-word answers
      /^\s*\d+\s*[\+\-\*\/\^]\s*\d+\s*=?\s*$/,                           // Simple math
      /^\s*(what'?s?\s+up|how\s+are\s+you|how\s+is\s+it\s+going)\s*$/i, // Casual chat
      /^\s*(lol|lmao|haha|hehe)\s*$/i,                                    // Reactions
    ];

    if (simplePatterns.some(p => p.test(query))) {
      return NextResponse.json({ isComplex: false });
    }

    // ── Fast-path: Simple factual lookups (no reasoning needed) ──
    const simpleFactualPatterns = [
      /^\s*(what is|who is|where is|when is|how old is)\s+\w+\s*\??$/i,   // Simple definitions
      /^\s*(capital of|population of|founder of|ceo of)\s+\w+\s*\??$/i,   // Simple facts
      /^\s*(convert|translate)\s+\d+\s+\w+\s+to\s+\w+\s*\??$/i,         // Unit conversions
      /^\s*(weather|time|date)\s+in\s+\w+\s*\??$/i,                      // Current info requests
    ];

    if (simpleFactualPatterns.some(p => p.test(query))) {
      return NextResponse.json({ isComplex: false });
    }

    // ── Fast-path: Short casual questions ──
    if (query.trim().length < 25 && !query.includes('?')) {
      return NextResponse.json({ isComplex: false });
    }

    // ── Gemini API evaluation ──
    if (!process.env.GEMINI_API_KEY) {
      // Fallback: heuristic based on length + keywords
      const complexKeywords = /(explain|how|why|compare|contrast|difference|analyze|design|implement|optimize|debug|architecture|algorithm|pattern|best practice|tradeoff|pros and cons|step by step|in depth|detailed|comprehensive|multi|complex|hard|difficult|advanced)/i;
      const isComplex = query.length > 80 || complexKeywords.test(query);
      return NextResponse.json({ isComplex });
    }

    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    let text = '';
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 10,
          },
          systemInstruction: `You are a query classifier. Determine if the user query requires DEEP THINKING (step-by-step reasoning, multi-step analysis, coding, architecture design, debugging, complex math proofs, philosophical reasoning, comparative analysis, or detailed explanations).

SIMPLE queries (reply FALSE):
- Greetings (hi, hello)
- Direct factual questions ("What is capital of France?", "Who is CEO of Tesla?")
- Short commands ("Summarize this", "Make it shorter")
- Simple definitions ("What is photosynthesis?")
- Unit conversions, simple calculations
- One-sentence answers

COMPLEX queries (reply TRUE):
- "Explain TCP vs UDP with code examples"
- "Design a distributed rate limiter"
- "Debug this React memory leak"
- "Compare microservices vs monoliths with tradeoffs"
- "Implement a LRU cache in TypeScript"
- "Why does this algorithm have O(n²) complexity?"
- Multi-part questions requiring synthesis

Reply with ONLY "TRUE" or "FALSE". No explanation.`
        });

        const result = await model.generateContent(query);
        text = result.response.text().trim().toUpperCase();
        break;
      } catch (err: any) {
        console.warn(`Complexity eval ${modelName} failed:`, err.message);
        lastError = err;
      }
    }

    if (!text && lastError) {
      throw lastError;
    }

    const isComplex = text.includes('TRUE');
    return NextResponse.json({ isComplex });

  } catch (error) {
    console.error('Complexity evaluation error:', error);
    // Safe fallback: assume simple on error (better UX than always thinking)
    return NextResponse.json({ isComplex: false });
  }
}
