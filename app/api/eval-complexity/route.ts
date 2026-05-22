import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    
    if (!query) {
      return NextResponse.json({ isComplex: false });
    }

    if (!process.env.GEMINI_API_KEY) {
       // Fallback logic
       return NextResponse.json({ isComplex: query.length > 60 || /explain|how|why|difference|compare|summarize/i.test(query) });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: 'Analyze the user query. Is it a complex question? Does it require step-by-step reasoning, deep analysis, coding, multi-faceted explanation, or philosophical thought? Simple greetings, direct factual questions (like "what is the capital of France"), or short commands are NOT complex. Reply with ONLY "TRUE" if it is complex, or "FALSE" if it is simple.'
    });

    const result = await model.generateContent(query);
    const text = result.response.text().trim().toUpperCase();
    
    const isComplex = text.includes('TRUE');
    
    return NextResponse.json({ isComplex });
  } catch (error) {
    console.error('Error evaluating complexity:', error);
    // Fallback logic if API fails
    return NextResponse.json({ isComplex: true });
  }
}
