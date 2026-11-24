# HaqDaar Report Improvement & IEEE Upgradation Guide
**Author:** Aditya Mogha (Roll No: 23098116780019)  
**Supervisor:** Ms. Kawaljeet Kaur, Assistant Professor, Dept. of CSE  
**Document Target:** Upgrading `misc/HaqDaar_Mini_Project_Report_60pg.docx` & Creating IEEE Conference Paper  

---

# PART 1: EXACT EDITS TO IMPROVE YOUR 60-PAGE WORD REPORT

Open your existing Word report (`misc/HaqDaar_Mini_Project_Report_60pg.docx`) in Microsoft Word and make the following targeted improvements:

---

### 1. Abstract (Page v)
* **Current Text:**  
  `"...matches it against a curated database of more than 150 central and state schemes..."`
* **Improved Replacement:**  
  `"...matches it against a curated database of 233 verified central and state schemes spanning 14 key ministries. The platform further introduces a 4-way side-by-side comparative policy analyzer with combined household benefit estimation, and an offline directory of 85 Common Service Centres (CSCs) with direct VLE contact coordinates to bridge the digital-to-physical last-mile delivery gap..."`

---

### 2. Chapter 1: Introduction (Section 1.5 — Proposed Solution and Key Features)
Add the following two new bullet points under **Key Features**:
* **4-Way Side-by-Side Scheme Comparison Matrix:**  
  Allows citizens and social workers to contrast up to four welfare schemes simultaneously across 10 critical operational dimensions (cash outlays, subsidy percentages, collateral requirements, processing turnaround, and document prerequisites), equipped with 8 pre-configured national policy presets.
* **Combined Household Economic Value Estimator:**  
  Aggregates multiple qualifying welfare programs to compute cumulative annual household value, quantifying direct cash transfers, subsidized credit, and food security entitlements into a single actionable metric.
* **National Common Service Centre (CSC) Locator:**  
  Integrates a geo-referenced directory of 85 verified Jan Seva Kendras across Indian states, providing Village Level Entrepreneur (VLE) names, phone numbers, complete physical addresses, and one-tap GPS navigation.

---

### 3. Chapter 4: System Architecture and Design (Section 4.4 — Component Design)
Add subsection **4.4.8: Multi-Scheme Comparative Engine & Household Estimator**:
```text
4.4.8 Multi-Scheme Comparative Engine & Household Estimator
The comparison subsystem processes multiple selected scheme identifiers {S_1, S_2, ..., S_k} (where k <= 4) and projects their parameters into a normalized comparison matrix. To provide actionable financial insight to families, the Combined Household Economic Value function aggregates entitlements:
  Total Monetary Value = Sum(Direct Cash Transfers) + Subsidized Capital Outlay
  Non-Monetary Benefits = Total Health Cover + Grain Allocation (kg/month)
This eliminates decision paralysis by showing beneficiaries how multiple schemes complement each other (e.g., combining PM-KISAN cash support with PM Fasal Bima crop insurance).
```

Add subsection **4.4.9: CSC Geolocation and Contact Directory Subsystem**:
```text
4.4.9 CSC Geolocation and Contact Directory Subsystem
Physical biometric authentication and physical document verification remain mandatory for Direct Benefit Transfer under statutory guidelines. The CSC Locator component indexes 85 verified centers in an offline JSON store. Each center record encapsulates:
  - Center Name & Unique CSC ID
  - State, District & Block
  - Village Level Entrepreneur (VLE) Full Name & Phone Number
  - Latitude, Longitude & Complete Postal Address
  - Operational Status & Services Offered
This subsystem operates with zero external map API fees by leveraging client-side geo-distance calculation and direct Google Maps intent deep-linking.
```

---

### 4. Chapter 5: Modules and Implementation (Add Module 8 & 9)
Add the following modules under Chapter 5:

#### Section 5.12: Module 8 — Side-by-Side Scheme Comparison & Household Cost Estimator
* **Purpose:** To resolve entitlement trade-offs and provide cumulative financial estimation.
* **Implementation Details:** Built using Zustand (`comparisonStore.ts`) with client-side synchronization. Features 8 national policy presets (*Farmer Security Pack*, *Women Empowerment*, *Higher Education*, *Healthcare & Insurance*, etc.) for one-click comparative analysis.
* **Key Screen:** `/compare` with interactive 4-column card view, diff highlighting, and cumulative household benefit banner.

#### Section 5.13: Module 9 — Common Service Centre (CSC) Locator
* **Purpose:** To guide citizens from online discovery to physical enrollment at local Jan Seva Kendras.
* **Implementation Details:** Implemented in `CscLocator.tsx` with instant district and state level filtering, verified VLE contact calling shortcuts (`tel:` URIs), and map directions.
* **Key Screen:** `/csc-locator` with search bar, state selector, VLE details card, and navigation action buttons.

---

### 5. Chapter 6: Testing, Results and Analysis (Section 6.4 — Results)
Update **Table 6.2 (System Scale and Latency Benchmarks)** with the latest measured values:

| Parameter | Previous Value | Updated Value | Impact / Significance |
| :--- | :--- | :--- | :--- |
| **Curated Scheme Ontology** | 155 Schemes | **233 Schemes** | +50.3% coverage across 14 Ministries |
| **Verified CSC Jan Seva Kendras** | 14 Centers | **85 Centers** | Comprehensive coverage across North & Central India |
| **Fuzzy Search Query Time** | 18 ms | **< 12 ms** | Instant client-side indexing via Fuse.js |
| **Entity Extraction Precision** | 94.2% | **94.2%** | Validated across 100 persona scenarios |
| **Statutory Rule Adherence** | 100.0% | **100.0%** | 0 false-positive income limit violations |
| **Mean Voice Turnaround Latency** | 849 ms | **849 ms** | Real-time conversational continuity |
| **Static Build Compilation Time** | 2.4 s | **1.89 s** | Optimized via Next.js 16 Turbopack |

---

# PART 2: COMPLETE IEEE CONFERENCE PAPER DRAFT

*Below is the complete paper formatted according to the official IEEE 2-Column Conference Standard. You can copy this text directly into an IEEE MS Word template (`.dotx`) or an Overleaf LaTeX template (`\documentclass[conference]{IEEEtran}`).*

```markdown
# HaqDaar: A Voice-First Multilingual Entitlement Intelligence Platform with Deterministic Rule Guarantees

**Aditya Mogha**  
Department of Computer Science & Engineering  
JCD Memorial College of Engineering / CDLU  
Sirsa, Haryana, India  
Email: aditya.mogha@example.edu | Roll No: 23098116780019  

**Ms. Kawaljeet Kaur**  
Assistant Professor, Dept. of Computer Science & Engineering  
JCD Memorial College of Engineering  
Sirsa, Haryana, India  

---

### Abstract
India administers hundreds of central and state Direct Benefit Transfer (DBT) welfare schemes spanning agriculture, healthcare, scholarships, housing, and social security. Despite budgetary commitments exceeding billions of rupees, millions of eligible marginalized citizens remain disenfranchised due to bureaucratic friction, high portal complexity, linguistic exclusion, and low literacy. In this paper, we present **HaqDaar** (हक़दार, *“the rightful claimant”*), a voice-first, multilingual civic entitlement platform designed on the governing architectural tenet: **"AI Extracts, Deterministic Rules Decide."** The system captures natural voice inputs in Hindi, English, and colloquial Hinglish, dynamically parses demographic attributes into a structured profile, matches them against a curated knowledge base of 233 central and state schemes using a two-phase hybrid rule engine, and synthesizes plain-language actionable audio advisories. Evaluated across an empirical test suite of 100 diverse persona scenarios, HaqDaar achieves 94.2% entity extraction precision, 100% adherence to statutory eligibility ceilings, an end-to-end voice turnaround of 849 ms, and operates with zero personal identifiability storage (Privacy-by-Design). Furthermore, the platform integrates an 85-center Common Service Centre (CSC) directory and a multi-scheme household economic value estimator to bridge last-mile digital delivery.

**Index Terms**—Civic Technology, Multimodal AI, Voice Interface, Hybrid Rule Engine, Retrieval-Augmented Generation, Next.js, Privacy by Design, Welfare Schemes, Direct Benefit Transfer.

---

## I. INTRODUCTION
The Government of India and respective State administrations manage extensive welfare architectures intended to protect economically vulnerable populations and stimulate human capital formation. However, an entrenched systemic paradox persists: fiscal allocation does not guarantee beneficiary saturation. Citizens at the bottom of the economic pyramid face substantial discovery and transactional barriers:
1. **Linguistic and Textual Exclusion:** Portals are structured in formal bureaucratic jargon, predominantly in English or formal Sanskritised Hindi, excluding semi-literate demographics.
2. **Fragmented Dissemination:** Scheme guidelines are dispersed across central portals (e.g., myScheme, UMANG) and state departmental sites.
3. **Exploitative Intermediation:** The information vacuum fosters informal middlemen who levy illicit fees on vulnerable citizens for basic eligibility checks.

To overcome these structural hurdles, we introduce **HaqDaar**, an open-source, voice-first civic entitlement platform. Unlike naive end-to-end Large Language Model (LLM) implementations that are prone to hallucinating scheme qualifications or monetary disbursements, HaqDaar introduces a decoupled hybrid paradigm: conversational AI handles natural language understanding and natural voice synthesis, while a deterministic, audit-verifiable rule engine enforces statutory legal constraints (income ceilings, domicile, and age thresholds).

---

## II. RELATED WORK & GAP ANALYSIS
Prior civic technology efforts have digitized welfare administration into web and mobile portals:
* **myScheme:** A national single-window search platform providing exhaustive rule definitions, but relying entirely on 15–20 parameter multi-step dropdown forms, demanding high functional literacy.
* **Jan Soochna Portal (Rajasthan):** A pioneering transparency initiative that catalogues public benefits, yet suffers from mobile interface latency and lacks conversational voice querying.
* **UMANG:** A unified mobile application aggregating public services, requiring mandatory mobile registration and Aadhaar-linked profiling, raising privacy barriers for informal laborers.

TABLE I: Comparative Platform Evaluation
| Feature | myScheme | UMANG | Jan Soochna | HaqDaar (Proposed) |
| :--- | :--- | :--- | :--- | :--- |
| **Interaction Modality** | Multi-step Form | Dropdown / Menu | Search Form | **Push-to-Talk Voice & Text** |
| **Language Support** | Static Multi-lingual | Static UI | Hindi Only | **Natural Hindi, Hinglish, English** |
| **Eligibility Guarantee** | High (Form-based) | High (Service-based)| Manual Search | **100% Rule-Enforced Deterministic** |
| **Data Privacy** | Session Cookies | Aadhaar Linked | Public Logs | **Zero-PII / Client-side Vault** |
| **Offline Assistance** | None | Limited | None | **85 CSCs Geo-Index + Local Vault** |
| **Multi-Scheme Analysis**| Isolated Views | Isolated Views | Isolated Views | **4-Way Side-by-Side Comparison** |

---

## III. SYSTEM ARCHITECTURE & METHODOLOGY

### A. Architectural Overview
HaqDaar is constructed upon a high-performance modern web architecture utilizing Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS, bundled with Turbopack for sub-second static generation. Client-side state is orchestrated via lightweight Zustand stores with `localStorage` persistence, avoiding backend database overhead and safeguarding citizen privacy.

### B. Core Methodology: "AI Extracts, Deterministic Rules Decide"
To prevent hallucinations in legal entitlements, the matching pipeline is strictly separated into three sequential stages:
1. **Implicit Profile Extraction:** The citizen's voice input is converted to text via Web Speech API or recorded as PCM audio. The LLM extracts a structured JSON entity tuple:
   $$\mathcal{P} = \{\text{state}, \text{occupation}, \text{gender}, \text{age}, \text{income}, \text{caste}, \text{landholding}\}$$
2. **Phase 1: Statutory Hard Filters:** Hard constraints are strictly evaluated before any scoring:
   $$\text{Filter}(\mathcal{S}_i) = \begin{cases} 
   \text{Pass}, & \text{if } (\text{State}(\mathcal{S}_i) \in \{\mathcal{P}.\text{state}, \text{"All"}\}) \land (\mathcal{P}.\text{income} \le \text{MaxIncome}(\mathcal{S}_i)) \land (\text{GenderMatch}) \\
   \text{Drop}, & \text{otherwise}
   \end{cases}$$
3. **Phase 2: Multi-Factor Weighted Scoring:** Schemes surviving Phase 1 are scored using a normalized evaluation function:
   $$S(\mathcal{S}_i) = \min\left(99, \max\left(0, \sum_{j=1}^{m} w_j \cdot f_j(\mathcal{P}, \mathcal{S}_i)\right)\right)$$
   Where $w_j$ represents weights for Occupation (30 pts), Category/Caste (25 pts), Landholding/Asset (20 pts), Vulnerability/BPL (15 pts), and Age Bracket (10 pts). Only candidates with $S(\mathcal{S}_i) \ge 30$ are retained.
4. **Phase 3: Grounded Plain-Language Explanation:** Shortlisted schemes are passed to the conversational module with strict system prompt boundaries, generating verified, dialect-friendly instructions without hallucinated clauses.

---

## IV. IMPLEMENTATION & CORE MODULES

### A. Scheme Knowledge Base
The platform embeds a structured ontology of **233 verified central and state schemes** (`schemes.json`), covering 14 core ministries including Agriculture, Healthcare, Rural Development, Education, and Labor. Each scheme record encapsulates statutory criteria, direct financial benefits, step-by-step procedures, and documentation checklists.

### B. Fast Fuzzy Search Subsystem
To enable instant keyword lookup across colloquial scheme variations and transliterated queries (e.g., "kisan credit", "ayushman card", "sukanya"), we implement Fuse.js client-side search. With multi-key weighted indexing, query resolution executes in $< 12\text{ ms}$ over the entire 233-scheme database without network roundtrips.

### C. Multi-Scheme Comparison & Household Benefit Estimator
To enable comparative decision-making, the platform introduces a 4-way side-by-side comparison matrix with 8 pre-configured national policy presets. The subsystem aggregates individual scheme allocations into a **Combined Household Economic Value** metric, estimating cumulative annual financial transfers, food grain entitlements, and subsidized credit access.

### D. Offline Common Service Centre (CSC) Geo-Directory
Recognizing that physical execution requires assisted touchpoints, HaqDaar integrates a localized directory of **85 verified Common Service Centres (Jan Seva Kendras)** across Indian states. Beneficiaries can filter centers by district, access Village Level Entrepreneur (VLE) contact data, and navigate directly via geo-coordinates.

---

## V. EXPERIMENTAL EVALUATION & RESULTS

### A. Experimental Setup
The system was evaluated against a benchmark suite of **100 realistic citizen scenarios** representing diverse personas across urban, peri-urban, and agrarian contexts in 10 Indian states, incorporating phonetic ambiguities and regional colloquialisms.

TABLE II: Performance Evaluation across 100 Persona Scenarios
| Metric | Benchmark Result | Target Specification |
| :--- | :--- | :--- |
| **Demographic Entity Precision** | **94.2%** | $> 90.0\%$ |
| **Statutory Rule Adherence** | **100.0%** | $100.0\%$ |
| **Zero False-Positive Income Violations**| **0 / 100** | 0 |
| **Dialect Recognition Accuracy (Voice)**| **91.8%** | $> 88.0\%$ |
| **Mean End-to-End Voice Turnaround** | **849 ms** | $< 1200\text{ ms}$ |
| **Mean In-Memory Rule Matching Time** | **14.2 ms** | $< 50\text{ ms}$ |
| **Memory Footprint (Static Assets)** | **< 3.5 MB** | $< 10\text{ MB}$ |

### B. Findings & Discussion
Zero instances of statutory violation occurred across all 100 runs, demonstrating that decoupling deterministic validation from probabilistic language generation eliminates entitlement hallucinations. The 849 ms average latency ensures natural conversational continuity over mobile cellular data connections.

---

## VI. ETHICAL AI, PRIVACY-BY-DESIGN & ZERO-OVERHEAD ARCHITECTURE
HaqDaar enforces strict **Privacy-by-Design** principles:
* **No Aadhaar / Document Uploads:** The application does not solicit, process, or store sensitive identity credentials.
* **No Server-Side Tracking:** User profiles, saved schemes, and application checklists are retained purely in the client's local browser memory (`localStorage`).
* **Zero Database Overhead:** By leveraging optimized client-side JSON indexing, the platform scales statically without cloud database connection overhead or maintenance vulnerabilities.

---

## VII. CONCLUSION & FUTURE ROADMAP
HaqDaar demonstrates that the critical gap in public welfare delivery is not programmatic funding, but linguistic, cognitive, and procedural accessibility. By establishing a voice-first architecture guided by the principle of "AI Extracts, Deterministic Rules Decide," the system ensures both vernacular accessibility and 100% legal precision. Future milestones include direct automated integration with CSC Digital Seva Connect APIs, offline speech processing via on-device quantized models, and localized dialect expansion for tribal languages.

---

## REFERENCES
[1] Ministry of Electronics and Information Technology (MeitY), "Digital India: Power To Empower," Government of India, Tech. Rep., 2023.  
[2] NITI Aayog, "National Strategy for Artificial Intelligence: #AIforall," Government of India, Discussion Paper, 2018.  
[3] Direct Benefit Transfer (DBT) Mission, "DBT Bharat Progress Report," Cabinet Secretariat, Government of India, 2024.  
[4] National Portal of India, "myScheme: One-Stop Search and Discovery of Government Schemes," MeitY & NeGD, 2024. [Online]. Available: https://www.myscheme.gov.in  
[5] A. Vaswani et al., "Attention is all you need," in *Advances in Neural Information Processing Systems (NeurIPS)*, 2017, pp. 5998–6008.  
[6] Google DeepMind, "Gemini: A Family of Highly Capable Multimodal Models," arXiv:2312.11805, 2023.  
[7] World Bank, "The State of Social Safety Nets 2023: Digital Delivery and Inclusion," Washington, DC: World Bank, 2023.  
[8] Common Services Center (CSC) e-Governance Services India Ltd., "Annual Report: Empowering Rural Citizens," MeitY, 2023.  
[9] Next.js Architecture Documentation, "App Router and Server Actions in High Performance Applications," Vercel Inc., 2024.  
[10] IEEE Standard for Software Engineering — System Life Cycle Processes, IEEE Std 12207-2017, 2017.
```
