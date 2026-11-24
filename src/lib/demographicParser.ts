// src/lib/demographicParser.ts — Centralized Multilingual Indian Demographic & Scheme Parser
import schemeData from "@/data/schemes.json";

export interface CitizenProfile {
  gender?: "female" | "male" | "other" | null;
  age?: number | null;
  occupation?: string | null;
  skills?: string | null;
  income?: number | null;
  caste?: "SC" | "ST" | "OBC" | "general" | "minority" | null;
  bpl?: boolean | null;
  state?: string | null;
  needs_loan?: boolean | null;
  widow?: boolean | null;
  disability?: boolean | null;
  raw_text?: string;
}

export function extractDemographics(
  userText: string,
  existingProfile: CitizenProfile = {}
): { profile: CitizenProfile; readyToMatch: boolean } {
  const profile: CitizenProfile = { ...existingProfile };
  const lower = userText.toLowerCase();

  // Gender
  if (/महिला|स्त्री|औरत|girl|woman|female|लड़की|विधवा|widow|माता|बहन|गृहिणी|गृहणी/i.test(lower)) {
    profile.gender = "female";
    if (/विधवा|widow/i.test(lower)) profile.widow = true;
  } else if (/पुरुष|आदमी|man|male|लड़का|boy/i.test(lower) && !profile.gender) {
    profile.gender = "male";
  }

  // Homemaker / Housewife
  if (/गृहिणी|गृहणी|housewife|homemaker|घरेलू महिला/i.test(lower)) {
    profile.gender = "female";
    if (!profile.occupation) profile.occupation = "homemaker";
  }

  // Tailoring / Stitching / दर्जी
  if (/सिलाई|सिलना|दर्जी|tailor|stitching|garment|कढ़ाई|बुनाई|सिलाई मशीन/i.test(lower)) {
    profile.skills = "tailoring";
    profile.occupation = "self_employed";
    profile.needs_loan = true;
  }

  // Loan / Business / Startup / Shop
  if (/लोन|कर्ज|ऋण|मुद्रा|loan|काम शुरू|दुकान|व्यवसाय|बिजनेस|व्यापार|स्वरोजगार|start.*business|pme?gp/i.test(lower)) {
    profile.needs_loan = true;
    if (!profile.occupation || profile.occupation === "homemaker") {
      profile.occupation = "self_employed";
    }
  }

  // Farmer / Agriculture
  if (/किसान|खेती|kisan|farmer|krishi|कृषि|फसल|ज़मीन|भूमि|पशुपालन|डेयरी|dairy/i.test(lower)) {
    profile.occupation = "farmer";
  }

  // Student / Education
  if (/विद्यार्थी|छात्र|छात्रा|student|पढ़ाई|college|school|scholarship|फीस/i.test(lower)) {
    profile.occupation = "student";
  }

  // Labor / Daily wage
  if (/मजदूर|मजदूरी|श्रमिक|दिहाड़ी|labor|labour|daily wage|construction|कामगार|e-shram|ठेला|रिक्शा/i.test(lower)) {
    profile.occupation = "daily_wage";
  }

  // Unemployed
  if (/बेरोजगार|unemployed|नौकरी ढूंढ|job search/i.test(lower)) {
    profile.occupation = "unemployed";
  }

  // Retired / Senior
  if (/रिटायर|बुजुर्ग|वृद्ध|पेंशन|senior|retired/i.test(lower)) {
    profile.occupation = "retired";
  }

  // Age parsing: "35 वर्ष", "35 साल", "age 35", "35 years old", "उम्र 35"
  const ageMatch =
    lower.match(/(\d{1,2})\s*(?:साल|वर्ष|years?|yrs?|age)/i) ||
    lower.match(/(?:उम्र|age)\s*[:=]?\s*(\d{1,2})/i);
  if (ageMatch) {
    const parsed = parseInt(ageMatch[1], 10);
    if (parsed >= 10 && parsed <= 100) profile.age = parsed;
  }

  // Income parsing: "2 लाख", "2 lakh", "80 हजार", "80000"
  const lakhMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:लाख|lakh|lac)/i);
  if (lakhMatch) {
    profile.income = Math.round(parseFloat(lakhMatch[1]) * 100000);
  } else {
    const hazaarMatch = lower.match(/(\d+)\s*(?:हजार|हज़ार|hazar|hazaar|k)/i);
    if (hazaarMatch) {
      profile.income = parseInt(hazaarMatch[1], 10) * 1000;
    } else {
      const numMatch = lower.match(/(?:₹|rs\.?|inr)?\s*([1-9]\d{4,6})/i);
      if (numMatch) {
        profile.income = parseInt(numMatch[1], 10);
      }
    }
  }

  // Caste / Category
  if (/ओबीसी|obc|other backward class|पिछड़ा|पिछड़े/i.test(lower)) profile.caste = "OBC";
  else if (/\bsc\b|दलित|अनुसूचित जाति/i.test(lower)) profile.caste = "SC";
  else if (/\bst\b|आदिवासी|जनजाति|अनुसूचित जनजाति/i.test(lower)) profile.caste = "ST";
  else if (/general|सामान्य वर्ग|समान्य/i.test(lower)) profile.caste = "general";
  else if (/minority|अल्पसंख्यक|मुस्लिम|सिख|ईसाई|जैन/i.test(lower)) profile.caste = "minority";

  // BPL / Ration Card
  if (/bpl|गरीबी रेखा|बीपीएल|राशन कार्ड|ration card|गरीब/i.test(lower)) {
    profile.bpl = true;
  }

  // State parsing
  if (/उत्तर प्रदेश|up|u\.p\.|uttar pradesh|लखनऊ|वाराणसी|कानपुर/i.test(lower)) profile.state = "UP";
  else if (/महाराष्ट्र|mh|maharashtra|मुंबई|पुणे|नागपुर/i.test(lower)) profile.state = "MH";
  else if (/राजस्थान|rajasthan|rj|जयपुर|जोधपुर/i.test(lower)) profile.state = "RJ";
  else if (/बिहार|bihar|पटना|गया/i.test(lower)) profile.state = "Bihar";
  else if (/मध्य प्रदेश|mp|madhya pradesh|भोपाल|इंदौर/i.test(lower)) profile.state = "MP";
  else if (/गुजरात|gujarat|gj|अहमदाबाद|सूरत/i.test(lower)) profile.state = "GJ";
  else if (/पश्चिम बंगाल|west bengal|wb|कोलकाता/i.test(lower)) profile.state = "WB";
  else if (/तमिलनाडु|tamil nadu|tn|चेन्नई/i.test(lower)) profile.state = "TN";
  else if (/कर्नाटक|karnataka|बेंगलुरु/i.test(lower)) profile.state = "KA";
  else if (/हरियाणा|haryana/i.test(lower)) profile.state = "HR";
  else if (/पंजाब|punjab/i.test(lower)) profile.state = "PB";
  else if (/दिल्ली|delhi/i.test(lower)) profile.state = "DL";
  else if (/ओडिशा|odisha|orissa/i.test(lower)) profile.state = "Odisha";

  // Cumulative text
  profile.raw_text = `${existingProfile.raw_text ? existingProfile.raw_text + " | " : ""}${userText}`.slice(0, 800);

  // Ready to match condition: if any 2 of (gender, occupation, income, caste, state, needs_loan) are known
  const knownCount = [
    profile.gender,
    profile.occupation,
    profile.income,
    profile.caste,
    profile.state,
    profile.needs_loan,
    profile.age,
  ].filter((v) => v !== null && v !== undefined && v !== "").length;

  const readyToMatch = knownCount >= 2 || Boolean(profile.occupation || profile.needs_loan || profile.gender);

  return { profile, readyToMatch };
}

export function matchCitizenSchemes(profile: CitizenProfile) {
  const allSchemes = (schemeData as any).schemes || [];
  const raw = (profile.raw_text || "").toLowerCase();
  const userGender = profile.gender ? profile.gender.toLowerCase() : null;

  const validSchemes: any[] = [];

  for (const s of allSchemes) {
    const el = s.eligibility || {};
    const elGender = el.gender ? el.gender.toLowerCase() : null;

    // ─── HARD GATE 1: GENDER MISMATCH ─────────────────────────────────────
    const isFemaleOnly =
      elGender === "female" ||
      s.category === "women" ||
      s.tags?.some((t: string) => ["girl", "beti", "women", "widow", "female", "mahila", "kanya"].includes(t.toLowerCase())) ||
      /kanya|balika|widow|vidhwa|mahila|women|girl|female/i.test(s.name);

    if (userGender === "male" && isFemaleOnly) {
      continue; // Strictly ineligible for males
    }
    if (userGender === "female" && elGender === "male") {
      continue; // Ineligible for females
    }

    // ─── HARD GATE 2: WIDOW SPECIFIC SCHEMES ─────────────────────────────
    const isWidowScheme =
      Boolean((el as any).widow) ||
      s.tags?.some((t: string) => ["widow", "vidhwa"].includes(t.toLowerCase())) ||
      /widow|vidhwa|विधवा/i.test(s.name);

    if (isWidowScheme && (profile.widow !== true || userGender === "male")) {
      continue;
    }

    // ─── HARD GATE 3: DISABILITY ─────────────────────────────────────────
    const isDisability =
      Boolean((el as any).disability) ||
      s.category === "disability" ||
      s.tags?.some((t: string) => ["disability", "divyang", "विकलांग"].includes(t.toLowerCase()));

    if (isDisability && profile.disability !== true) {
      continue;
    }

    // ─── HARD GATE 4: STATE ──────────────────────────────────────────────
    if (profile.state && s.state !== "all" && s.level !== "central") {
      if (s.state.toLowerCase() !== profile.state.toLowerCase()) {
        continue;
      }
    }

    // ─── HARD GATE 5: AGE ────────────────────────────────────────────────
    const minAge = el.age_min ?? el.minAge;
    const maxAge = el.age_max ?? el.maxAge;
    if (profile.age) {
      if (minAge !== undefined && minAge !== null && profile.age < minAge) continue;
      if (maxAge !== undefined && maxAge !== null && profile.age > maxAge) continue;
    }

    // ─── HARD GATE 6: INCOME ─────────────────────────────────────────────
    const maxIncome = el.income_max ?? el.maxIncome;
    if (profile.income && maxIncome && profile.income > maxIncome) {
      continue;
    }

    // ─── HARD GATE 7: CASTE ──────────────────────────────────────────────
    const rawCastes = el.caste;
    const elCastes: string[] = rawCastes
      ? Array.isArray(rawCastes)
        ? rawCastes.map((c: string) => c.toUpperCase())
        : [String(rawCastes).toUpperCase()]
      : [];

    if (elCastes.length > 0 && !elCastes.includes("ALL")) {
      if (!profile.caste || !elCastes.includes(profile.caste.toUpperCase())) {
        continue;
      }
    }

    // ─── HARD GATE 8: OCCUPATION ─────────────────────────────────────────
    const elOcc = (el.occupation || []).map((o: string) => o.toLowerCase());
    const occ = (profile.occupation || "").toLowerCase();
    if (occ && elOcc.length > 0 && !elOcc.includes("all")) {
      const isOccMatch = elOcc.some((o: string) => o === occ || occ.includes(o));
      if (!isOccMatch) {
        const isSkillOrJob = (occ === "unemployed" || occ === "student") && elOcc.includes("student");
        if (!isSkillOrJob) {
          continue;
        }
      }
    }

    // ─── POSITIVE MERIT SCORING ──────────────────────────────────────────
    let score = 30;
    const reasons: string[] = [];

    // Central vs State match
    if (profile.state && s.state && s.state.toLowerCase() === profile.state.toLowerCase()) {
      score += 30;
      reasons.push(`${profile.state} राज्य योजना`);
    } else if (s.state === "all" || s.level === "central") {
      score += 15;
    }

    // Female empowerment incentive
    if (profile.gender === "female") {
      if (s.category === "women" || el.gender === "female") {
        score += 30;
        reasons.push("महिला विशेष लाभ");
      }
    }

    // Occupation Match
    if (occ && elOcc.includes(occ)) {
      score += 35;
      reasons.push(
        occ === "student"
          ? "छात्र / विद्यार्थी पात्रता"
          : occ === "farmer"
          ? "किसान पात्रता"
          : "व्यवसाय / पेशा पात्रता"
      );
    } else if (elOcc.includes("all")) {
      score += 10;
    }

    // Tailor / Stitching Artisan Match
    if (/सिलाई|दर्जी|tailor|stitching|कढ़ाई/.test(raw)) {
      if (s.id.includes("vishwakarma") || s.name.toLowerCase().includes("vishwakarma")) {
        score += 55;
        reasons.push("दर्जी / सिलाई टूलकिट व 5% सस्ता ऋण");
      }
    }

    // Loan / Entrepreneurship / Business
    if (profile.needs_loan || /लोन|loan|काम शुरू|कारोबार|मुद्रा|व्यवसाय|स्वरोजगार/.test(raw)) {
      if (s.category === "startup" || s.id.includes("mudra") || s.id.includes("pmegp") || s.id.includes("standup")) {
        score += 45;
        reasons.push("व्यवसाय लोन व सरकारी सब्सिडी");
      }
    }

    // Caste eligibility bonus
    if (profile.caste && elCastes.includes(profile.caste.toUpperCase())) {
      score += 20;
      reasons.push(`${profile.caste} वर्ग पात्रता`);
    }

    // Income eligibility bonus
    if (profile.income && maxIncome) {
      score += 15;
      reasons.push(`आय सीमा (₹${(maxIncome / 100000).toFixed(1)}L) के अंतर्गत`);
    }

    // BPL eligibility bonus
    if (profile.bpl && el.bpl) {
      score += 15;
      reasons.push("BPL / राशन कार्ड पात्रता");
    }

    validSchemes.push({ ...s, score: Math.min(99, score), reasons });
  }

  return validSchemes
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, 12);
}

export function generatePersonalizedResponse(
  profile: CitizenProfile,
  matches: any[],
  language = "en"
): string {
  const isHindi = language === "hi";

  if (matches.length > 0) {
    const topMatches = matches.slice(0, 4);

    if (isHindi) {
      const summaryItems = topMatches.map((m: any, idx: number) => {
        const name = m.nameHindi || m.name;
        const benefit = m.benefitHindi || m.benefit || "";
        const briefBenefit = benefit.slice(0, 90).replace(/\.$/, "");
        return `${idx + 1}. **${name}**: ${briefBenefit}`;
      });

      let profileAcks = [];
      if (profile.gender === "female") profileAcks.push("महिला");
      if (profile.gender === "male") profileAcks.push("पुरुष");
      if (profile.age) profileAcks.push(`${profile.age} वर्ष`);
      if (profile.skills === "tailoring") profileAcks.push("सिलाई कार्य");
      if (profile.occupation && profile.occupation !== "self_employed") profileAcks.push(profile.occupation === "farmer" ? "किसान" : profile.occupation);
      if (profile.caste) profileAcks.push(profile.caste);
      if (profile.state) profileAcks.push(profile.state);
      if (profile.income) profileAcks.push(`₹${(profile.income / 100000).toFixed(1)} लाख वार्षिक आय`);

      const ackText = profileAcks.length > 0 ? ` (${profileAcks.join(", ")})` : "";

      return `नमस्ते! आपकी स्थिति${ackText} के अनुसार हमने आपके लिए **${matches.length} प्रमुख सरकारी योजनाएं** खोजी हैं:\n\n${summaryItems.join("\n\n")}\n\n👉 आप इनमें से किसी भी योजना के लिए आवेदन करने का तरीका और ज़रूरी दस्तावेज़ नीचे देख सकते हैं। क्या आप किसी विशेष योजना के बारे में विस्तार से जानना चाहते हैं?`;
    } else {
      const summaryItems = topMatches.map((m: any, idx: number) => {
        const name = m.name;
        const benefit = m.benefit || "";
        const briefBenefit = benefit.slice(0, 90).replace(/\.$/, "");
        return `${idx + 1}. **${name}**: ${briefBenefit}`;
      });

      let profileAcks = [];
      if (profile.gender === "female") profileAcks.push("Female");
      if (profile.gender === "male") profileAcks.push("Male");
      if (profile.age) profileAcks.push(`${profile.age} years old`);
      if (profile.occupation) profileAcks.push(profile.occupation.replace("_", " "));
      if (profile.caste) profileAcks.push(`${profile.caste} Category`);
      if (profile.state) profileAcks.push(profile.state);
      if (profile.income) profileAcks.push(`₹${(profile.income / 100000).toFixed(1)} Lakh annual income`);

      const ackText = profileAcks.length > 0 ? ` (${profileAcks.join(", ")})` : "";

      return `Hello! Based on your profile${ackText}, we have identified **${matches.length} key government welfare schemes** for you:\n\n${summaryItems.join("\n\n")}\n\n👉 You can check eligibility criteria and required documents below. Would you like details on any specific scheme?`;
    }
  }

  // If no schemes matched yet, ask for missing essential pieces in the user's language
  if (isHindi) {
    return `नमस्ते! मैंने आपकी जानकारी नोट कर ली है। कृपया अपना गृह राज्य और पारिवारिक वार्षिक आय भी बताएं ताकि हम आपके लिए उपलब्ध सटीक सरकारी योजनाएं और सब्सिडी निकाल सकें।`;
  } else {
    return `Hello! I have noted your details. Could you also share your home state and annual family income so we can find your exact eligible schemes and benefits?`;
  }
}
