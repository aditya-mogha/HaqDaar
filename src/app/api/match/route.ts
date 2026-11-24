// POST /api/match — RAG Scheme Matching via Gemini with rule-based fallback
import { NextRequest, NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini";
import { matchRequestSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/rate-limit";
import { matchSchemesRuleBased, schemes, getCandidatesForRAG } from "@/lib/schemeSearch";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
  const limiter = rateLimit(`match:${ip}`, { maxRequests: 30, windowMs: 60000 });
  if (!limiter.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please wait a moment." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const parsed = matchRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { profile, candidates } = parsed.data;

    const candidateList = (candidates && candidates.length > 0)
      ? candidates
      : getCandidatesForRAG(profile);

    // Hard filter candidate list to prevent gender/widow/state hallucinations
    const userGender = typeof profile.gender === "string" ? profile.gender.toLowerCase() : null;
    const filteredCandidates = candidateList.filter((c: any) => {
      const el = c.eligibility || {};
      const elGender = el.gender ? String(el.gender).toLowerCase() : null;
      if (userGender === "male") {
        if (
          elGender === "female" ||
          c.category === "women" ||
          (Array.isArray(c.tags) && c.tags.some((t: string) => ["girl", "beti", "women", "widow", "female", "mahila"].includes(String(t).toLowerCase()))) ||
          /kanya|balika|widow|vidhwa|mahila|women|girl/i.test(String(c.name || ""))
        ) {
          return false;
        }
      }
      if (String(c.name || "").toLowerCase().includes("widow") && !profile.widow) {
        return false;
      }
      return true;
    });

    const userOcc = typeof profile.occupation === "string" ? profile.occupation : "";
    const userState = typeof profile.state === "string" ? profile.state : "";
    const userAge = typeof profile.age === "number" ? profile.age : null;
    const userIncome = typeof profile.income === "number" ? profile.income : null;
    const userCaste = typeof profile.caste === "string" ? profile.caste : "";

    const systemPrompt = `You are an expert Indian government scheme eligibility evaluator.
Given a citizen's demographic profile and a list of candidate government welfare schemes, evaluate each scheme's relevance and eligibility precisely.

CITIZEN PROFILE:
${JSON.stringify(profile, null, 2)}

STRICT EVALUATION RULES:
1. GENDER: If citizen is MALE, score 0 for any scheme exclusively for females/girls/mothers/widows.
2. WIDOWHOOD: Score 0 for widow schemes unless citizen is explicitly confirmed as a widow.
3. OCCUPATION MATCH: Schemes matching the citizen's exact occupation (farmer→agriculture, student→scholarship) score highest.
4. AGE: Disqualify if citizen's age falls outside the scheme's age range.
5. INCOME: Disqualify if citizen's income exceeds the scheme's max income limit.
6. CASTE: Disqualify if scheme requires a specific caste category the citizen doesn't belong to.
7. STATE: State-specific schemes for other states score 0. Central/all-India schemes are eligible for everyone.

SCORING GUIDELINES:
- 85-99: Perfect match — occupation, state, caste, income all align. Citizen is clearly eligible.
- 70-84: Strong match — most criteria align, minor fields unknown.
- 50-69: Moderate match — some criteria align, some unknown.
- 40-49: Weak match — only generic eligibility.
- Below 40: Do not include.

Return a valid JSON array of objects, sorted by score descending, max 12 schemes:
[
  {
    "id": "scheme_id",
    "score": 85,
    "reason": "Clear 1-sentence explanation of why they qualify",
    "relevant": true
  }
]`;

    const userMessage = {
      role: "user",
      content: `Evaluate these candidate schemes for the citizen:\n${JSON.stringify(
        filteredCandidates.map((c) => ({
          id: c.id,
          name: c.name,
          category: c.category,
          state: c.state,
          level: c.level,
          benefit: c.benefit,
          eligibility: c.eligibility,
          tags: c.tags,
        })),
        null,
        2
      )}`,
    };

    try {
      const aiResult = await callGemini(systemPrompt, [userMessage], 3000);
      const rawText = aiResult.content?.[0]?.text || "[]";
      const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const rankedMatches = JSON.parse(cleaned);
      const allowedIds = new Set(filteredCandidates.map((c) => c.id));
      const cleanRankedMatches = (Array.isArray(rankedMatches) ? rankedMatches : []).filter(
        (m: any) => allowedIds.has(m.id) && m.relevant !== false && m.score >= 35
      );

      return NextResponse.json({
        success: true,
        source: "gemini",
        matches: cleanRankedMatches,
      });
    } catch (aiErr) {
      console.warn("[Match API] Gemini error, falling back to rule-based matcher:", (aiErr as Error).message);
      const fallbackMatches = matchSchemesRuleBased(profile);
      return NextResponse.json({
        success: true,
        source: "rule-based",
        matches: fallbackMatches.map((m) => ({
          id: m.id,
          score: m.score,
          reason: m.reasons.join(". ") || "Matches your demographic profile",
          relevant: true,
        })),
      });
    }
  } catch (err) {
    console.error("[API /match] Uncaught error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
