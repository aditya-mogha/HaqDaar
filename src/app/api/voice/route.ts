// POST /api/voice — Multimodal Voice Audio Processing via Gemini 2.5 Flash + Intelligent Fallback
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import {
  extractDemographics,
  matchCitizenSchemes,
  generatePersonalizedResponse,
} from "@/lib/demographicParser";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
  const limiter = rateLimit(`voice:${ip}`, { maxRequests: 35, windowMs: 60000 });
  if (!limiter.success) {
    return NextResponse.json(
      { error: "Too many voice requests. Please slow down." },
      { status: 429 }
    );
  }

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const {
      audioBase64,
      mimeType = "audio/webm",
      history = [],
      language = "hi",
      profile = {},
      text: incomingText,
    } = body || {};

    if (!audioBase64 && !incomingText) {
      return NextResponse.json(
        { error: "audioBase64 or text field is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const isApiKeyValid = apiKey && apiKey !== "your_gemini_api_key_here" && !apiKey.startsWith("your_");

    // ─── Gemini AI Processing ──────────────────────────────────────────────────
    if (isApiKeyValid) {
      const knownProfileEntries = Object.entries(profile || {}).filter(
        ([k, v]) => v !== null && v !== undefined && v !== "" && k !== "raw_text"
      );
      const knownProfileStr =
        knownProfileEntries.length > 0
          ? knownProfileEntries.map(([k, v]) => `${k}: ${v}`).join(", ")
          : "None yet";

      // Detect language from input text to give Gemini an accurate language mandate
      const hasDevanagari = incomingText ? /[\u0900-\u097F]/.test(incomingText) : false;
      const isEnglishText = incomingText ? /^[a-zA-Z0-9\s.,!?'"()\-₹:;@#%&*\/]+$/.test(incomingText.trim()) : false;
      let langDirective: string;
      if (incomingText) {
        langDirective = hasDevanagari
          ? "The citizen is speaking/writing in HINDI. Reply 100% in Hindi (Devanagari)."
          : isEnglishText
            ? "The citizen is speaking/writing in ENGLISH. Reply 100% in English. Do NOT reply in Hindi."
            : "Match the citizen's language exactly. If they speak English, reply in English. If Hindi, reply in Hindi.";
      } else if (audioBase64) {
        langDirective = language === "en"
          ? "The citizen's UI is set to English. If the audio sounds English, reply in English. If Hindi, reply in Hindi."
          : "The citizen's UI is set to Hindi. If the audio sounds Hindi, reply in Hindi. If English, reply in English.";
      } else {
        langDirective = "Reply in the same language the citizen used.";
      }

      const voicePrompt = `You are HaqDaar, an empathetic Indian government welfare scheme guide.
Listen carefully to the citizen's audio or text message and help them find eligible schemes.

STRICT LANGUAGE RULE (CRITICAL):
${langDirective}

ALREADY KNOWN DEMOGRAPHIC FACTS (do NOT re-ask for these):
${knownProfileStr}

Your task:
1. TRANSCRIPTION: Accurately transcribe what the citizen said. If you receive audio, transcribe the actual spoken words faithfully. If you receive text, use it as the transcript.
2. PROFILE EXTRACTION: Silently extract demographic facts into a structured profile:
   - state: Indian state code (UP, MH, RJ, TN, WB, KA, Bihar, MP, GJ, HR, PB, DL, etc.) or null
   - occupation: farmer, student, daily_wage, self_employed, unemployed, retired, homemaker, or null
   - income: annual income in rupees (number) or null. Convert: "2 lakh" = 200000, "80 hazaar" = 80000
   - age: number or null
   - gender: "male" or "female" or null
   - caste: "SC", "ST", "OBC", "general", "minority" or null
   - bpl: boolean or null
   - widow: boolean or null
   - raw_text: cumulative summary of citizen's situation
3. RESPONSE: Provide a warm, conversational reply that:
   - Acknowledges what they said specifically (don't give generic greetings)
   - If you have enough info (occupation OR state OR income), say you're finding their schemes
   - If missing critical info, ask for 1-2 specific things (e.g., "Which state do you live in?" or "What is your age?")
   - Keep it concise (2-3 sentences max) for natural speech
4. READY TO MATCH: Set true if you have at least: (occupation OR state) AND one more field. Set false otherwise.

MANDATORY RULES:
- NEVER re-ask for information already in the known facts above
- RETAIN and MERGE all previously known facts in your output profile
- If citizen corrects a fact, update it and acknowledge warmly
- Keep responses short and natural — they will be spoken aloud

Return valid JSON strictly matching this schema:
{
  "transcript": "Exact transcription of citizen's words",
  "message": "Your concise conversational response in their language",
  "profile": {
    "state": null,
    "occupation": null,
    "income": null,
    "age": null,
    "gender": null,
    "caste": null,
    "bpl": null,
    "widow": null,
    "raw_text": ""
  },
  "ready_to_match": false
}`;

      // Build request parts
      const userParts: any[] = [];
      const cleanMimeType = (mimeType || "audio/webm").split(";")[0].trim();

      if (audioBase64) {
        userParts.push({
          inlineData: {
            mimeType: cleanMimeType,
            data: audioBase64,
          },
        });
        if (incomingText && incomingText.trim()) {
          // Provide client-side transcript as a hint for better accuracy
          userParts.push({ text: `Browser speech recognition transcript (may be approximate): "${incomingText}". Use this as a hint but transcribe the audio independently for accuracy.` });
        }
        userParts.push({
          text: "Transcribe the audio accurately, extract demographic facts, and reply warmly in their spoken language.",
        });
      } else if (incomingText) {
        userParts.push({
          text: `Citizen said: "${incomingText}"\n\nExtract demographic facts and reply warmly in their language.`,
        });
      }

      // Build conversation history (only recent, deduplicated)
      const pastContents = (history || [])
        .slice(-6)
        .filter((m: any) => (m.content || m.text || "").trim().length > 0)
        .map((m: { role: string; content?: string; text?: string }) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content || m.text || "" }],
        }));

      const contents = [
        ...pastContents,
        {
          role: "user",
          parts: userParts,
        },
      ];

      // Try Gemini models
      const candidateModels = ["gemini-2.5-flash"];
      let rawText = "";

      for (const model of candidateModels) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const payload = {
          systemInstruction: { parts: [{ text: voicePrompt }] },
          contents,
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 2048,
            responseMimeType: "application/json",
          },
        };

        try {
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (res.ok) {
            const data = await res.json();
            rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
            if (rawText) break;
          } else {
            const errData = await res.json().catch(() => ({}));
            console.warn(`[Voice API] ${model} returned ${res.status}:`, errData?.error?.message);
          }
        } catch (fetchErr) {
          console.warn(`[Voice API] ${model} fetch error:`, (fetchErr as Error).message);
        }
      }

      if (rawText) {
        try {
          let outputObj: any = JSON.parse(rawText);

          // Merge profile: keep all existing facts, overlay new extractions
          const mergedProfile: any = { ...(profile || {}) };
          const newProfile = outputObj.profile || {};
          for (const [key, val] of Object.entries(newProfile)) {
            if (val !== null && val !== undefined && val !== "") {
              mergedProfile[key] = val;
            }
          }
          outputObj.profile = mergedProfile;

          if (!outputObj.transcript && incomingText) {
            outputObj.transcript = incomingText;
          }

          // ─── Neural TTS Audio Synthesis ──────────────────────────────────
          let audioOutputBase64: string | null = null;
          if (outputObj.message) {
            try {
              const cleanSpeechText = String(outputObj.message)
                .replace(/[*#_`~>\[\]\(\)]/g, "")
                .replace(/\n+/g, " ")
                .trim()
                .slice(0, 800);

              // Pick TTS voice based on response language
              const responseIsHindi = /[\u0900-\u097F]/.test(cleanSpeechText);
              const ttsVoice = responseIsHindi ? "Kore" : "Kore"; // Kore handles both well

              const ttsUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;
              const ttsRes = await fetch(ttsUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [
                    {
                      role: "user",
                      parts: [{ text: `Read this aloud clearly, naturally, and warmly: ${cleanSpeechText}` }],
                    },
                  ],
                  generationConfig: {
                    responseModalities: ["AUDIO"],
                    speechConfig: {
                      voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: ttsVoice },
                      },
                    },
                  },
                }),
              });

              if (ttsRes.ok) {
                const ttsData = await ttsRes.json();
                audioOutputBase64 = ttsData.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
              }
            } catch (ttsErr) {
              console.warn("[Voice API] TTS synthesis failed:", (ttsErr as Error).message);
            }
          }

          return NextResponse.json({
            ...outputObj,
            audioBase64: audioOutputBase64,
            sampleRate: 24000,
          });
        } catch (parseErr) {
          console.warn("[Voice API] JSON parse error from Gemini:", (parseErr as Error).message);
        }
      }
    }

    // ─── RESILIENT LOCAL FALLBACK (Zero External Dependency) ─────────────────
    const allUserTexts = (history || [])
      .filter((m: any) => m.role === "user")
      .map((m: any) => m.content || m.text || "");
    if (incomingText && incomingText.trim()) {
      allUserTexts.push(incomingText.trim());
    }
    const cumulativeVoiceText = allUserTexts.join(" | ") || incomingText || "";

    const effectiveText = incomingText?.trim() || (allUserTexts.length > 0 ? allUserTexts[allUserTexts.length - 1] : "");
    const isVoiceDevanagari = /[\u0900-\u097F]/.test(effectiveText);
    const replyLang = isVoiceDevanagari ? "hi" : (effectiveText ? "en" : (language || "en"));

    const { profile: updatedProfile, readyToMatch } = extractDemographics(
      cumulativeVoiceText,
      profile || {}
    );

    const matches = matchCitizenSchemes(updatedProfile);
    let replyMessage = "";

    if (effectiveText) {
      replyMessage = generatePersonalizedResponse(updatedProfile, matches, replyLang);
    } else {
      replyMessage =
        replyLang === "hi"
          ? "आपकी आवाज़ स्पष्ट नहीं आ सकी। कृपया माइक्रोफ़ोन के पास बोलें या अपना संदेश टाइप करें।"
          : "Could not clearly capture voice audio. Please speak near the mic or type your message.";
    }

    return NextResponse.json({
      transcript: effectiveText || "",
      message: replyMessage,
      profile: updatedProfile,
      ready_to_match: readyToMatch && matches.length > 0,
      matches: matches.slice(0, 10),
      audioBase64: null,
      sampleRate: 24000,
    });
  } catch (err) {
    console.error("[Voice API] Uncaught error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
