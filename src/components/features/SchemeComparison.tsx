"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  X,
  Plus,
  ArrowRight,
  CheckCircle,
  Building2,
  ExternalLink,
  Bookmark,
  Trash2,
  Scale,
  Sparkles,
  Calculator,
  Coins,
  ShieldCheck,
  Clock,
  MapPin,
  Check,
  Copy,
  Info,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { Scheme, schemes, categories } from "@/lib/schemeSearch";
import { useComparisonStore } from "@/lib/comparisonStore";
import { useDashboardStore } from "@/lib/dashboardStore";

interface SchemeFinancials {
  annualCash: number;
  capitalSupport: number;
  insuranceCover: number;
  officialFee: number;
  cscKioskFee: number;
  turnaround: string;
}

function extractFinancialEstimates(s: Scheme): SchemeFinancials {
  let annualCash = 0;
  let capitalSupport = 0;
  let insuranceCover = 0;
  let turnaround = "15–30 Days";

  const bText = (s.benefit + " " + (s.benefitHindi || "")).toLowerCase();

  // Insurance
  if (s.benefitType === "insurance" || s.category === "health" || bText.includes("insurance") || bText.includes("cover") || bText.includes("bima")) {
    if (bText.includes("5,00,000") || bText.includes("5 lakh") || bText.includes("5l")) {
      insuranceCover = 500000;
    } else if (bText.includes("2,00,000") || bText.includes("2 lakh") || bText.includes("2l")) {
      insuranceCover = 200000;
    } else if (bText.includes("7,00,000") || bText.includes("7 lakh")) {
      insuranceCover = 700000;
    } else if (bText.includes("80,000")) {
      insuranceCover = 80000;
    } else {
      insuranceCover = 200000;
    }
    turnaround = "Instant / 7 Days";
  }

  // Cash transfer & pension
  if (s.benefitType === "cash_transfer" || s.benefitType === "pension" || bText.includes("/month") || bText.includes("/year") || bText.includes("माह") || bText.includes("वर्ष")) {
    const monthlyMatch = bText.match(/₹([\d,]+)\s*(?:\/|\s*per\s*)month|₹([\d,]+)\s*(?:प्रति\s*माह|\/माह)/i);
    const yearlyMatch = bText.match(/₹([\d,]+)\s*(?:\/|\s*per\s*)year|₹([\d,]+)\s*(?:प्रति\s*वर्ष|\/वर्ष)/i);

    if (monthlyMatch) {
      const val = parseInt((monthlyMatch[1] || monthlyMatch[2]).replace(/[^\d]/g, ""), 10);
      if (val > 0 && val <= 25000) {
        annualCash = val * 12;
      }
    } else if (yearlyMatch) {
      const val = parseInt((yearlyMatch[1] || yearlyMatch[2]).replace(/[^\d]/g, ""), 10);
      if (val > 0 && val <= 100000) {
        annualCash = val;
      }
    } else if (bText.includes("6,000") || bText.includes("pm-kisan")) {
      annualCash = 6000;
    } else if (bText.includes("25,000")) {
      annualCash = 25000;
    } else if (bText.includes("12,000")) {
      annualCash = 12000;
    } else {
      annualCash = 10000;
    }
    turnaround = "7–15 Days (DBT)";
  }

  // Subsidies & Loans (Capital support)
  if (s.benefitType === "subsidy" || s.benefitType === "loan" || s.category === "startup" || s.category === "housing" || s.category === "energy") {
    if (bText.includes("78,000")) {
      capitalSupport = 78000;
      annualCash = Math.max(annualCash, 18000); // Solar bill savings
    } else if (bText.includes("3 lakh") || bText.includes("3,00,000") || bText.includes("vishwakarma")) {
      capitalSupport = 315000;
    } else if (bText.includes("1.30 lakh") || bText.includes("1.20 lakh") || bText.includes("pmay")) {
      capitalSupport = 130000;
    } else if (bText.includes("50,000")) {
      capitalSupport = 50000;
    } else if (bText.includes("25 lakh") || bText.includes("25,00,000")) {
      capitalSupport = 2500000;
    } else if (bText.includes("5 crore") || bText.includes("5 cr")) {
      capitalSupport = 50000000;
    } else if (bText.includes("12,000") || bText.includes("toilet")) {
      capitalSupport = 12000;
    } else {
      capitalSupport = 50000;
    }
    turnaround = "15–30 Days";
  }

  // Scholarships
  if (s.benefitType === "scholarship" || s.category === "scholarship") {
    if (bText.includes("50,000")) {
      annualCash = 50000;
    } else if (bText.includes("10,000")) {
      annualCash = 10000;
    } else if (bText.includes("12,000")) {
      annualCash = 12000;
    } else if (bText.includes("free coaching") || bText.includes("मुफ्त कोचिंग")) {
      annualCash = 60000; // estimated tuition fee saving
    } else {
      annualCash = 15000;
    }
    turnaround = "30–45 Days (Academic)";
  }

  // In-kind / equipment
  if (s.benefitType === "in_kind" || s.benefitType === "service") {
    if (bText.includes("smartphone") || bText.includes("tablet")) {
      capitalSupport = 15000;
    } else if (bText.includes("dialysis")) {
      annualCash = 180000; // dialysis sessions saved
    } else if (bText.includes("free bus") || bText.includes("happy card") || bText.includes("pink")) {
      annualCash = 18000; // annual transportation saved
    }
    turnaround = "7–20 Days";
  }

  return {
    annualCash,
    capitalSupport,
    insuranceCover,
    officialFee: 0,
    cscKioskFee: 30,
    turnaround,
  };
}

export default function SchemeComparison() {
  const {
    selectedSchemes,
    removeSchemeFromCompare,
    addSchemeToCompare,
    clearCompare,
    MAX_COMPARE,
  } = useComparisonStore();
  const { addScheme, isSaved } = useDashboardStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");
  const [selectedLevelFilter, setSelectedLevelFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Popular preset comparisons covering all domains
  const presetComparisons = [
    {
      title: "🌾 Farmer Income & Crop Security",
      desc: "Direct Income Support + Crop Insurance + Institutional Credit",
      ids: ["PM-KISAN-001", "PMFBY-001", "KCC-001", "PMKSY-001"],
    },
    {
      title: "🏥 Universal Health & Dialysis Shield",
      desc: "₹5L Cashless Inpatient + Free Dialysis + District Diagnostic Labs",
      ids: ["ABPMJAY-001", "PMNDP-001", "PM-ABHIM-001", "PMSMA-001"],
    },
    {
      title: "👩 Women Direct Cash & Welfare",
      desc: "Direct Income Grants + Girl Child Education + Maternal Health",
      ids: ["MP-LADLIBEHNA-001", "TN-MAGALIRURIMAI-001", "KA-GRUHALAKSHMI-001", "UP-KANYASUMANGALA-001"],
    },
    {
      title: "🏠 Affordable Housing & Sanitation",
      desc: "Rural & Urban Pucca House Grants + Sanitation + Piped Water",
      ids: ["PMAYG-001", "PMAYU-001", "SBMG2-001", "JJM-001"],
    },
    {
      title: "🎓 Merit Scholarships & Future Skills",
      desc: "Exemplary Schools + Technical Degree Scholarships + Drone & AI Training",
      ids: ["PMSHRI-001", "PRAGATI-001", "CSIS-001", "PMKVY4-001"],
    },
    {
      title: "🚀 MSME, Artisan & Vendor Credit",
      desc: "Artisan Toolkit & Cheap Credit + Micro Business Loans + Collateral-Free Guarantees",
      ids: ["PM-VISHWAKARMA-001", "PMSVANIDHI-001", "STANDUP-001", "PMEGP-001"],
    },
    {
      title: "☀️ Clean Energy & Solar Rooftop",
      desc: "₹78,000 Central Capital Subsidy + Free Solar Feeder Pumps + Bio-Gas",
      ids: ["PMSURYAGHAR-001", "PMKUSUM-A-001", "PMUY-001", "GOBAR-001"],
    },
    {
      title: "👴 Senior Citizens & Old Age Security",
      desc: "Guaranteed Monthly Pension + Old Age Allowance + Life Insurance Protection",
      ids: ["APY-001", "PM-SYM-001", "PMKMY-001", "EDLI-001"],
    },
  ];

  // Filter schemes for the Add Scheme Modal
  const availableSchemes = useMemo(() => {
    return schemes.filter((s) => {
      if (selectedSchemes.some((sel) => sel.id === s.id)) return false;
      if (selectedCategoryFilter !== "all" && s.category !== selectedCategoryFilter) return false;
      if (selectedLevelFilter === "central" && s.level !== "central") return false;
      if (selectedLevelFilter === "state" && s.level !== "state") return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const matchName = s.name.toLowerCase().includes(q) || (s.nameHindi && s.nameHindi.toLowerCase().includes(q));
      const matchCat = s.category.toLowerCase().includes(q);
      const matchState = s.state.toLowerCase().includes(q);
      const matchTags = s.tags && s.tags.some((t) => t.toLowerCase().includes(q));
      return matchName || matchCat || matchState || matchTags;
    });
  }, [selectedSchemes, selectedCategoryFilter, selectedLevelFilter, searchQuery]);

  const applyPreset = (ids: string[]) => {
    clearCompare();
    ids.forEach((id) => addSchemeToCompare(id));
  };

  // Aggregated Cost & Entitlement Calculations
  const comparisonFinancials = useMemo(() => {
    let totalCash = 0;
    let totalCapital = 0;
    let totalInsurance = 0;
    let totalOfficialFees = 0;
    let totalCscFees = 0;

    selectedSchemes.forEach((s) => {
      const f = extractFinancialEstimates(s);
      totalCash += f.annualCash;
      totalCapital += f.capitalSupport;
      totalInsurance = Math.max(totalInsurance, f.insuranceCover);
      totalOfficialFees += f.officialFee;
      totalCscFees += f.cscKioskFee;
    });

    const netEstimatedHouseholdValue = totalCash + totalCapital;

    return {
      totalCash,
      totalCapital,
      totalInsurance,
      totalOfficialFees,
      totalCscFees,
      netEstimatedHouseholdValue,
    };
  }, [selectedSchemes]);

  const handleCopySummary = () => {
    if (selectedSchemes.length === 0) return;
    const textLines = [
      `🇮🇳 HaqDaar Welfare Comparison Summary:`,
      `Selected Programs (${selectedSchemes.length}):`,
      ...selectedSchemes.map((s, idx) => `${idx + 1}. ${s.name} (${s.level === "central" ? "Central" : s.state}) — ${s.benefit}`),
      ``,
      `📊 Financial Value & Cost Estimation:`,
      `• Estimated Annual Direct Cash/Savings: ₹${comparisonFinancials.totalCash.toLocaleString("en-IN")}/year`,
      `• Capital Subsidy / Credit Support Limit: ₹${comparisonFinancials.totalCapital.toLocaleString("en-IN")}`,
      `• Health / Risk Insurance Protection: ₹${comparisonFinancials.totalInsurance.toLocaleString("en-IN")}`,
      `• Official Application Fee: ₹0 (Free Government Service)`,
      `• Nearest CSC Jan Seva Kendra Kiosk Fee: ~₹${comparisonFinancials.totalCscFees} (Max nominal charge for PVC card/biometrics)`,
      ``,
      `Generated on HaqDaar — India's Unified Welfare Portal. Visit your nearest CSC to apply.`,
    ];

    navigator.clipboard.writeText(textLines.join("\n"));
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const handleSaveAll = () => {
    selectedSchemes.forEach((s) => addScheme(s.id));
  };

  return (
    <div className="w-full space-y-8">
      {/* ─── Header Bar ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gray-900/60 border border-white/10 backdrop-blur-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-xs font-semibold text-orange-400">
            <Scale className="w-3.5 h-3.5" />
            <span>Side-by-Side Scheme & Cost Analyzer</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Compare Welfare Programs</h1>
          <p className="text-xs sm:text-sm text-gray-400 max-w-2xl">
            Evaluate entitlement differences, financial cash inflows, application costs, and paperwork requirements side by side across all {schemes.length} verified programs.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {selectedSchemes.length > 0 && (
            <button
              onClick={clearCompare}
              className="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          )}

          {/* Add Scheme Button */}
          {selectedSchemes.length < MAX_COMPARE && (
            <button
              onClick={() => setModalOpen(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Scheme ({selectedSchemes.length}/{MAX_COMPARE})</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Preset Quick Comparisons ─────────────────────────── */}
      {selectedSchemes.length < 2 && (
        <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-200">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Curated Multi-Scheme Side-by-Side Comparisons:</span>
            </div>
            <span className="text-[11px] text-gray-400">Click any preset to compare 4 programs</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {presetComparisons.map((p) => (
              <button
                key={p.title}
                onClick={() => applyPreset(p.ids)}
                className="p-3.5 text-left rounded-2xl bg-gray-900/80 hover:bg-gray-900 border border-white/10 hover:border-orange-500/40 transition-all text-xs group flex flex-col justify-between space-y-2 cursor-pointer shadow-md"
              >
                <div>
                  <div className="font-bold text-white group-hover:text-orange-400 transition-colors">
                    {p.title}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                    {p.desc}
                  </div>
                </div>
                <div className="text-[10px] font-semibold text-orange-400 flex items-center justify-between pt-2 border-t border-white/5">
                  <span>Compare 4 Programs</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Comparison Grid Table ─────────────────────────── */}
      {selectedSchemes.length === 0 ? (
        <div className="text-center py-20 px-4 rounded-3xl bg-gray-900/30 border border-dashed border-white/10 space-y-4">
          <Scale className="w-12 h-12 text-gray-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Schemes Selected for Comparison</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
            Choose schemes using the "Add Scheme" button above, pick one of the curated presets, or browse the directory and click "Compare" on any scheme card.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => setModalOpen(true)}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
            >
              Select Schemes ({schemes.length} available)
            </button>
            <Link
              href="/schemes"
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-colors"
            >
              Browse Directory
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="overflow-x-auto pb-4">
            <div
              className="min-w-[850px] grid gap-4"
              style={{
                gridTemplateColumns: `240px repeat(${selectedSchemes.length}, minmax(240px, 1fr))`,
              }}
            >
              {/* Header Column: Row Labels */}
              <div className="space-y-6 pt-36 text-xs font-bold text-gray-400">
                <div className="h-10 flex items-center">Category & Jurisdiction</div>
                <div className="h-28 flex items-center">Direct Financial Benefit</div>
                <div className="h-12 flex items-center text-emerald-400">Est. Annual Cash Inflow</div>
                <div className="h-12 flex items-center text-blue-400">Capital Grant / Credit Limit</div>
                <div className="h-12 flex items-center text-purple-400">Insurance / Risk Shield</div>
                <div className="h-12 flex items-center text-amber-400">Citizen Application Fee</div>
                <div className="h-12 flex items-center">CSC / Jan Seva Kendra Charge</div>
                <div className="h-12 flex items-center">Est. Turnaround Time</div>
                <div className="h-16 flex items-center">Target Beneficiary</div>
                <div className="h-12 flex items-center">Age Eligibility</div>
                <div className="h-12 flex items-center">Income Ceiling</div>
                <div className="h-12 flex items-center">Social Category / Caste</div>
                <div className="h-24 flex items-center">Mandatory Documents</div>
                <div className="h-12 flex items-center">Application Modes</div>
                <div className="h-14 flex items-center">Official Action</div>
              </div>

              {/* Scheme Columns */}
              {selectedSchemes.map((scheme) => {
                const saved = isSaved(scheme.id);
                const fin = extractFinancialEstimates(scheme);

                return (
                  <div
                    key={scheme.id}
                    className="bg-gray-900/80 border border-white/10 rounded-3xl p-5 flex flex-col justify-between shadow-xl space-y-6 relative"
                  >
                    {/* Scheme Card Header */}
                    <div className="h-32 flex flex-col justify-between border-b border-white/10 pb-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-10 h-10 rounded-xl border border-white/10 shrink-0 bg-white/5 flex items-center justify-center text-xl">
                          {scheme.emoji || <Building2 className="w-5 h-5 text-orange-400" />}
                        </div>
                        <button
                          onClick={() => removeSchemeFromCompare(scheme.id)}
                          className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer"
                          title="Remove from comparison"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-white line-clamp-2 leading-tight">
                          {scheme.name}
                        </h3>
                        {scheme.nameHindi && (
                          <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">{scheme.nameHindi}</p>
                        )}
                      </div>
                    </div>

                    {/* Category & Level */}
                    <div className="h-10 flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-gray-300 uppercase">
                        {scheme.category}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-400 font-medium capitalize truncate">
                        {scheme.level === "central" ? "Central (All India)" : `${scheme.state} State`}
                      </span>
                    </div>

                    {/* Direct Benefit Description */}
                    <div className="h-28 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-300 leading-relaxed overflow-y-auto">
                      {scheme.benefit}
                    </div>

                    {/* Est. Annual Cash Inflow */}
                    <div className="h-12 flex items-center text-xs font-bold text-emerald-400">
                      {fin.annualCash > 0 ? (
                        <span>₹{fin.annualCash.toLocaleString("en-IN")} / year</span>
                      ) : (
                        <span className="text-gray-500 font-normal">Non-recurring / In-kind</span>
                      )}
                    </div>

                    {/* Capital Subsidy / Loan Limit */}
                    <div className="h-12 flex items-center text-xs font-bold text-blue-400">
                      {fin.capitalSupport > 0 ? (
                        <span>Up to ₹{fin.capitalSupport.toLocaleString("en-IN")}</span>
                      ) : (
                        <span className="text-gray-500 font-normal">No Capital Grant</span>
                      )}
                    </div>

                    {/* Insurance Cover */}
                    <div className="h-12 flex items-center text-xs font-bold text-purple-400">
                      {fin.insuranceCover > 0 ? (
                        <span>₹{fin.insuranceCover.toLocaleString("en-IN")} Cover</span>
                      ) : (
                        <span className="text-gray-500 font-normal">None</span>
                      )}
                    </div>

                    {/* Official Govt Fee */}
                    <div className="h-12 flex items-center text-xs font-bold text-emerald-400">
                      <span className="px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/20">
                        ₹0 (100% Free Govt Portal)
                      </span>
                    </div>

                    {/* CSC Kiosk Fee */}
                    <div className="h-12 flex items-center text-xs text-gray-300">
                      <span>Nominal ₹{fin.cscKioskFee} (PVC print / bio)</span>
                    </div>

                    {/* Turnaround Time */}
                    <div className="h-12 flex items-center text-xs font-medium text-amber-300">
                      <Clock className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                      <span>{fin.turnaround}</span>
                    </div>

                    {/* Target Occupation */}
                    <div className="h-16 text-xs text-gray-300 flex items-center">
                      {scheme.eligibility?.occupation && scheme.eligibility.occupation.length > 0 ? (
                        <span className="capitalize">{scheme.eligibility.occupation.join(", ")}</span>
                      ) : (
                        <span className="text-gray-500">Universal / All Occupations</span>
                      )}
                    </div>

                    {/* Age Eligibility */}
                    <div className="h-12 flex items-center text-xs text-gray-300">
                      {scheme.eligibility && (scheme.eligibility.minAge !== undefined || scheme.eligibility.maxAge !== undefined || (scheme.eligibility as any).age_min !== undefined || (scheme.eligibility as any).age_max !== undefined) ? (
                        <span>
                          {scheme.eligibility.minAge ?? (scheme.eligibility as any).age_min ?? 0} to{" "}
                          {scheme.eligibility.maxAge ?? (scheme.eligibility as any).age_max ?? "No cap"} years
                        </span>
                      ) : (
                        <span className="text-gray-500">All Ages Eligible</span>
                      )}
                    </div>

                    {/* Income Cap */}
                    <div className="h-12 flex items-center text-xs font-medium">
                      {scheme.eligibility && (scheme.eligibility.maxIncome || (scheme.eligibility as any).income_max) ? (
                        <span className="text-amber-300">
                          ≤ ₹{(scheme.eligibility.maxIncome ?? (scheme.eligibility as any).income_max).toLocaleString("en-IN")}/yr
                        </span>
                      ) : (
                        <span className="text-emerald-400">No Income Restriction</span>
                      )}
                    </div>

                    {/* Caste */}
                    <div className="h-12 flex items-center text-xs text-gray-300">
                      {scheme.eligibility?.caste && !scheme.eligibility.caste.includes("all") ? (
                        <span className="font-semibold text-orange-400">
                          {scheme.eligibility.caste.join(", ")}
                        </span>
                      ) : (
                        <span className="text-gray-500">All Categories (Universal)</span>
                      )}
                    </div>

                    {/* Documents */}
                    <div className="h-24 text-[11px] text-gray-300 leading-snug overflow-y-auto space-y-1">
                      {scheme.documents && scheme.documents.length > 0 ? (
                        scheme.documents.slice(0, 4).map((doc) => (
                          <div key={doc} className="flex items-center gap-1.5 truncate">
                            <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span className="truncate">{doc}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-gray-500">Aadhaar Card & Bank Account</span>
                      )}
                    </div>

                    {/* Application Mode */}
                    <div className="h-12 flex items-center text-xs text-gray-300">
                      <span className="truncate">
                        {Array.isArray(scheme.apply_mode) && scheme.apply_mode.length > 0
                          ? scheme.apply_mode.join(" • ")
                          : "Online Portal / CSC Center"}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="h-14 pt-2 border-t border-white/10 flex items-center gap-2">
                      <button
                        onClick={() => addScheme(scheme.id)}
                        className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                          saved
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-white/10 hover:bg-white/15 text-white border border-white/10"
                        }`}
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>{saved ? "Saved" : "Save"}</span>
                      </button>

                      {scheme.apply_url && (
                        <a
                          href={scheme.apply_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white transition-colors"
                          title="Open Official Portal"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─── DEDICATED COST ESTIMATION & HOUSEHOLD FINANCIAL IMPACT SECTION ─── */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-gray-900 via-gray-950 to-gray-950 border border-orange-500/30 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400">
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Cost Estimation & Financial Entitlement Summary</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Combined Household Economic Value
                </h3>
                <p className="text-xs text-gray-400">
                  Aggregated statutory entitlement for the {selectedSchemes.length} compared programs.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopySummary}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedSummary ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-gray-400" />
                      <span>Copy Summary</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleSaveAll}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Save All to Vault</span>
                </button>
              </div>
            </div>

            {/* 4 Financial Highlight Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Recurring Cash Inflow */}
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
                <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5" />
                  <span>Direct Annual Inflow</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white">
                  ₹{comparisonFinancials.totalCash.toLocaleString("en-IN")}
                </div>
                <div className="text-[11px] text-emerald-300/80">
                  Direct cash transfer, scholarships & pensions / year
                </div>
              </div>

              {/* Capital Grants / Loan Facility */}
              <div className="p-5 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-1.5">
                <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Capital Grant / Credit Cap</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white">
                  ₹{comparisonFinancials.totalCapital.toLocaleString("en-IN")}
                </div>
                <div className="text-[11px] text-blue-300/80">
                  Asset subsidies, housing assistance & subsidized credit
                </div>
              </div>

              {/* Insurance Risk Shield */}
              <div className="p-5 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-1.5">
                <div className="text-[11px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Insurance Risk Protection</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white">
                  ₹{comparisonFinancials.totalInsurance.toLocaleString("en-IN")}
                </div>
                <div className="text-[11px] text-purple-300/80">
                  Cashless hospitalization & accidental life safety net
                </div>
              </div>

              {/* Citizen Out-of-Pocket Cost */}
              <div className="p-5 rounded-2xl bg-orange-500/10 border border-orange-500/20 space-y-1.5">
                <div className="text-[11px] font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Total Citizen Cost</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white">
                  ₹0
                  <span className="text-xs font-semibold text-orange-300 ml-1.5">Official Fee</span>
                </div>
                <div className="text-[11px] text-orange-300/80">
                  Max ~₹{comparisonFinancials.totalCscFees} if printed at CSC Jan Seva Kendra
                </div>
              </div>
            </div>

            {/* Application Walkthrough & CSC Link */}
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-white">
                    Need offline assistance applying for these programs?
                  </div>
                  <div className="text-xs text-gray-400">
                    Visit any of our 85+ verified Common Service Centers (CSC), Jan Seva Kendras, and citizen support kiosks with your Aadhaar and Bank Passbook.
                  </div>
                </div>
              </div>

              <Link
                href="/csc-locator"
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shrink-0 shadow-lg shadow-orange-500/20 transition-all flex items-center gap-1.5"
              >
                <span>Find Nearest Kendra</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ─── ADD SCHEME FULL-SEARCH MODAL ─────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-gray-900 border border-white/15 rounded-3xl max-w-2xl w-full p-6 sm:p-8 relative shadow-2xl space-y-5 my-8">
            <button
              onClick={() => {
                setModalOpen(false);
                setSearchQuery("");
              }}
              className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-xs font-semibold text-orange-400 mb-2">
                <Plus className="w-3.5 h-3.5" />
                <span>Select from All {schemes.length} Schemes</span>
              </div>
              <h3 className="text-xl font-bold text-white">Add Scheme to Compare</h3>
              <p className="text-xs text-gray-400">
                Search by scheme title, benefits, keywords, or filter by category and state.
              </p>
            </div>

            {/* Search Input */}
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Search scheme name, e.g. Kisan, Ayushman, Ladli, Surya Ghar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-950 border border-white/15 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 shadow-inner"
                autoFocus
              />

              {/* Jurisdiction Level Filter */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <span className="text-gray-400 text-[11px] font-semibold shrink-0">Coverage:</span>
                {[
                  { id: "all", label: "All Schemes" },
                  { id: "central", label: "🏛️ Central (All India)" },
                  { id: "state", label: "📍 State Level" },
                ].map((lvl) => (
                  <button
                    key={lvl.id}
                    onClick={() => setSelectedLevelFilter(lvl.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      selectedLevelFilter === lvl.id
                        ? "bg-orange-500 text-white"
                        : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  onClick={() => setSelectedCategoryFilter("all")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategoryFilter === "all"
                      ? "bg-white/20 text-white"
                      : "bg-white/5 text-gray-400 hover:text-white"
                  }`}
                >
                  All Categories ({schemes.length})
                </button>
                {Object.entries(categories).map(([key, cat]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedCategoryFilter(key)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      selectedCategoryFilter === key
                        ? "bg-white/20 text-white"
                        : "bg-white/5 text-gray-400 hover:text-white"
                    }`}
                  >
                    <span>{cat.emoji}</span> {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scheme List */}
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1 divide-y divide-white/5">
              <div className="text-[11px] text-gray-400 pb-1">
                Found <strong className="text-white">{availableSchemes.length}</strong> matching schemes:
              </div>

              {availableSchemes.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-500">
                  No matching schemes found. Try adjusting your search or filters.
                </div>
              ) : (
                availableSchemes.map((s) => (
                  <div
                    key={s.id}
                    className="pt-2 flex items-center justify-between gap-3 p-2 rounded-2xl hover:bg-white/5 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-white/10 shrink-0 border border-white/10 flex items-center justify-center text-lg">
                        {s.emoji || <Building2 className="w-4 h-4 text-orange-400" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors truncate">
                          {s.name}
                        </div>
                        <div className="text-[10px] text-gray-400 flex items-center gap-2 mt-0.5">
                          <span className="uppercase font-semibold">{s.category}</span>
                          <span>•</span>
                          <span className="capitalize">{s.level === "central" ? "Central" : `${s.state} State`}</span>
                        </div>
                        <div className="text-[11px] text-emerald-400/90 truncate mt-0.5">
                          {s.benefit}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        addSchemeToCompare(s.id);
                        setModalOpen(false);
                        setSearchQuery("");
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-orange-500/20 hover:bg-orange-500 text-orange-400 hover:text-white border border-orange-500/30 transition-all shrink-0 cursor-pointer"
                    >
                      Compare
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
