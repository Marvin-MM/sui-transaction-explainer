import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transactionData } = body

    if (!transactionData) {
      return NextResponse.json({ error: "No transaction data provided" }, { status: 400 })
    }

    const apiKey = process.env.API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "API Key not configured" }, { status: 500 })
    }

    const genAI = new GoogleGenAI({ apiKey })
    const prompt = `
      You are an expert Sui blockchain transaction explainer.
      Explain the following transaction in clear, concise markdown.
      Use headers, bullet points, and code blocks where appropriate.
      Focus on what happened, who sent what, and the outcome.
      
      Transaction Data:
      ${JSON.stringify(transactionData, null, 2)}
    `

    // @ts-ignore - The SDK types might be slightly off
    const result = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ]
    })
    
    const text = result.text ? result.text : "No explanation generated"

    return NextResponse.json({ explanation: text })
  } catch (error) {
    console.error("AI Explain error:", error)
    return NextResponse.json({ error: "Failed to generate explanation" }, { status: 500 })
  }
}
