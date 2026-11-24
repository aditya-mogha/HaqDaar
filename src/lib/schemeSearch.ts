// Scheme Search Engine — Fuse.js fuzzy search + Rule-based fallback matcher
import Fuse from "fuse.js";
import schemeData from "@/data/schemes.json";

export interface Scheme {
  id: string;
  name: string;
  nameHindi: string;
  category: string;
  level: string;
  state: string;
  department: string;
  departmentLogo?: string;
  brief: string;
  briefHindi: string;
  benefit: string;
  benefitHindi: string;
  benefitType: string;
  eligibility: {
    occupation?: string[];
    gender?: string;
    minAge?: number;
    maxAge?: number;
    maxIncome?: number | null;
    caste?: string[];
    bpl?: boolean;
    area?: string;
    landholding?: string;
    other?: string[];
  };
  documents: string[];
  apply_mode: string[];
  apply_url: string;
  tags: string[];
  emoji?: string;
}

export interface SchemeCategory {
  label: string;
  labelHindi: string;
  emoji: string;
  color: string;
}

export const schemes: Scheme[] = schemeData.schemes as unknown as Scheme[];
export const categories: Record<string, SchemeCategory> = schemeData.categories as Record<string, SchemeCategory>;

const fuse = new Fuse(schemes, {
  keys: [
    { name: "name", weight: 0.3 },
    { name: "nameHindi", weight: 0.2 },
    { name: "benefit", weight: 0.15 },
    { name: "benefitHindi", weight: 0.1 },
    { name: "tags", weight: 0.15 },
    { name: "brief", weight: 0.1 },
  ],
  threshold: 0.4,
  includeScore: true,
});

export function searchSchemes(query: string): Scheme[] {
  if (!query || query.trim().length < 2) return schemes;
  return fuse.search(query.trim()).map((r) => r.item);
}

export function filterSchemes({
  category,
  state,
  level,
}: {
  category?: string;
  state?: string;
  level?: string;
} = {}): Scheme[] {
  return schemes.filter((s) => {
    if (category && category !== "all" && s.category !== category) return false;
    if (state && state !== "all" && s.state !== "all" && s.state.toLowerCase() !== state.toLowerCase()) {
      return false;
    }
    if (level && level !== "all" && s.level !== level) return false;
    return true;
  });
}

export interface MatchScoreResult extends Scheme {
  score: number;
  aiReason?: string;
  reasons: string[];
}

export function matchSchemesRuleBased(profile: Record<string, unknown>): MatchScoreResult[] {
  const userGender = typeof profile.gender === "string" ? profile.gender.toLowerCase() : null;
  const userState = typeof profile.state === "string" ? profile.state.toUpperCase() : null;
  const userIncome = typeof profile.income === "number" ? profile.income : null;
  const userAge = typeof profile.age === "number" ? profile.age : null;
  const userCaste = typeof profile.caste === "string" ? profile.caste.toUpperCase() : null;
  const userOcc = typeof profile.occupation === "string" ? profile.occupation.toLowerCase() : "";
  const rawText = typeof profile.raw_text === "string" ? profile.raw_text.toLowerCase() : "";

  const scored: MatchScoreResult[] = [];

  for (const scheme of schemes) {
    const el = scheme.eligibility || {};
    const elGender = el.gender ? el.gender.toLowerCase() : null;

    // ─── HARD GATE 1: GENDER MISMATCH ─────────────────────────────────────
    const isFemaleOnly =
      elGender === "female" ||
      scheme.category === "women" ||
      scheme.tags?.some((t) => ["girl", "beti", "women", "widow", "female", "mahila", "kanya"].includes(t.toLowerCase())) ||
      /kanya|balika|widow|vidhwa|mahila|women|girl|female/i.test(scheme.name);

    if (userGender === "male" && isFemaleOnly) {
      continue; // Strictly ineligible for males
    }
    if (userGender === "female" && elGender === "male") {
      continue; // Ineligible for females
    }

    // ─── HARD GATE 2: WIDOW SPECIFIC SCHEMES ─────────────────────────────
    const isWidowScheme =
      Boolean((el as any).widow) ||
      scheme.tags?.some((t) => ["widow", "vidhwa"].includes(t.toLowerCase())) ||
      /widow|vidhwa|विधवा/i.test(scheme.name);

    if (isWidowScheme && (profile.widow !== true || userGender === "male")) {
      continue; // Strictly ineligible unless explicitly verified as widow
    }

    // ─── HARD GATE 3: DISABILITY ─────────────────────────────────────────
    const isDisability =
      Boolean((el as any).disability) ||
      scheme.category === "disability" ||
      scheme.tags?.some((t) => ["disability", "divyang", "विकलांग"].includes(t.toLowerCase()));

    if (isDisability && profile.disability !== true) {
      continue;
    }

    // ─── HARD GATE 4: STATE JURISDICTION ─────────────────────────────────
    if (
      userState &&
      scheme.state !== "all" &&
      scheme.level !== "central" &&
      scheme.state.toUpperCase() !== userState
    ) {
      continue; // Another state's local scheme
    }

    // ─── HARD GATE 5: AGE RESTRICTION ────────────────────────────────────
    const minAge = (el as any).age_min ?? el.minAge;
    const maxAge = (el as any).age_max ?? el.maxAge;
    if (userAge !== null) {
      if (minAge !== undefined && minAge !== null && userAge < minAge) continue;
      if (maxAge !== undefined && maxAge !== null && userAge > maxAge) continue;
    }

    // ─── HARD GATE 6: INCOME CEILING ─────────────────────────────────────
    const incomeCap = (el as any).income_max ?? el.maxIncome;
    if (userIncome !== null && incomeCap && userIncome > incomeCap) {
      continue; // Exceeds income limit
    }

    // ─── HARD GATE 7: CASTE SPECIFICITY ──────────────────────────────────
    const rawCastes = (el as any).caste;
    const elCastes: string[] = rawCastes
      ? Array.isArray(rawCastes)
        ? rawCastes.map((c: string) => c.toUpperCase())
        : [String(rawCastes).toUpperCase()]
      : [];

    if (elCastes.length > 0 && !elCastes.includes("ALL")) {
      if (!userCaste || !elCastes.includes(userCaste)) {
        continue; // e.g. SC-only scholarship when applicant is OBC or unspecified
      }
    }

    // ─── HARD GATE 8: OCCUPATION SPECIFICITY ─────────────────────────────
    const elOcc = (el.occupation || []).map((o: string) => o.toLowerCase());
    if (userOcc && elOcc.length > 0 && !elOcc.includes("all")) {
      const isOccMatch = elOcc.some((o: string) => o === userOcc || userOcc.includes(o));
      if (!isOccMatch) {
        // Exception: student/unemployed youth looking for skills or training
        const isSkillOrJob = (userOcc === "unemployed" || userOcc === "student") && elOcc.includes("student");
        if (!isSkillOrJob) {
          continue; // Disqualified by occupation mismatch
        }
      }
    }

    // ─── POSITIVE MERIT SCORING ──────────────────────────────────────────
    let score = 30; // Qualified baseline
    const reasons: string[] = [];

    // State Score
    if (userState && scheme.state && scheme.state.toUpperCase() === userState) {
      score += 25;
      reasons.push(`${userState} राज्य विशेष योजना`);
    } else if (scheme.level === "central" || scheme.state === "all") {
      score += 15;
    }

    // Occupation Match
    if (userOcc && elOcc.includes(userOcc)) {
      score += 35;
      reasons.push(
        userOcc === "student"
          ? "छात्र / विद्यार्थी पात्रता"
          : userOcc === "farmer"
          ? "किसान पात्रता"
          : "व्यवसाय / पेशा पात्रता"
      );
    } else if (elOcc.includes("all")) {
      score += 10;
    }

    // Caste Entitlement
    if (userCaste && elCastes.includes(userCaste)) {
      score += 20;
      reasons.push(`${userCaste} वर्ग पात्रता`);
    }

    // Income Verification
    if (userIncome !== null && incomeCap) {
      score += 15;
      reasons.push(`आय सीमा (₹${(incomeCap / 100000).toFixed(1)}L) के अंतर्गत`);
    }

    // BPL Support
    if ((el as any).bpl && profile.bpl) {
      score += 15;
      reasons.push("बीपीएल / ईडब्ल्यूएस पात्रता");
    }

    scored.push({
      ...scheme,
      score: Math.min(99, score),
      reasons,
    });
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, 15);
}

export const matchSchemes = matchSchemesRuleBased;

export function getCandidatesForRAG(profile: Record<string, unknown>): Scheme[] {
  const userGender = typeof profile.gender === "string" ? profile.gender.toLowerCase() : null;
  const userState = typeof profile.state === "string" ? profile.state.toLowerCase() : null;

  return schemes
    .filter((s) => {
      // Filter out wrong state
      if (userState && s.state !== "all" && s.level !== "central" && s.state.toLowerCase() !== userState) {
        return false;
      }
      // Filter out female-only schemes if male
      if (userGender === "male") {
        const elGender = s.eligibility?.gender?.toLowerCase();
        const isFemaleOnly =
          elGender === "female" ||
          s.category === "women" ||
          s.tags?.some((t) => ["girl", "beti", "women", "widow", "female", "mahila"].includes(t.toLowerCase())) ||
          /kanya|balika|widow|vidhwa|mahila|women|girl/i.test(s.name);
        if (isFemaleOnly) return false;
      }
      // Filter out widow schemes if not widow
      if (s.name.toLowerCase().includes("widow") && !profile.widow) {
        return false;
      }
      return true;
    })
    .slice(0, 35);
}
