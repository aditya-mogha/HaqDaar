// POST /api/chat — Profile extraction via Gemini + Resilient Multilingual Fallback
import { NextRequest, NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini";
import { chatRequestSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/rate-limit";
import {
  extractDemographics,
  matchCitizenSchemes,
  generatePersonalizedResponse,
} from "@/lib/demographicParser";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
  const limiter = rateLimit(`chat:${ip}`, { maxRequests: 50, windowMs: 60000 });
  if (!limiter.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please slow down." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const parsed = chatRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { system, messages } = parsed.data;

    // 1. Attempt Gemini Call if API key configured
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey && apiKey !== "your_gemini_api_key_here" && !apiKey.startsWith("your_")) {
        const result = await callGemini(system, messages);
        return NextResponse.json(result);
      }
    } catch (geminiErr) {
      console.warn("[API /chat] Gemini call failed, using intelligent demographic parser:", (geminiErr as Error).message);
    }

    // 2. Intelligent Multilingual Fallback
    const allUserMessages = messages
      .filter((m) => m.role === "user")
      .map((m) => m.content);
    const cumulativeText = allUserMessages.join(" | ");

    const lastUserMsg = allUserMessages[allUserMessages.length - 1] || "";
    const isUserDevanagari = /[\u0900-\u097F]/.test(lastUserMsg);
    const replyLanguage = isUserDevanagari ? "hi" : "en";

    const { profile, readyToMatch } = extractDemographics(cumulativeText);
    const matches = matchCitizenSchemes(profile);
    const replyMessage = generatePersonalizedResponse(profile, matches, replyLanguage);

    return NextResponse.json({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            message: replyMessage,
            profile,
            ready_to_match: readyToMatch && matches.length > 0,
          }),
        },
      ],
    });
  } catch (err) {
    console.error("[API /chat] Error:", (err as Error).message);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
