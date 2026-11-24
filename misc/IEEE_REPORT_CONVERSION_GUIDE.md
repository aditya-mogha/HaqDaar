# IEEE Format Conversion Guide & Ready-to-Publish Paper Draft
**Project:** HaqDaar (हक़दार): Voice-First Multilingual AI Platform for Welfare Scheme Discovery  
**Author:** Aditya Mogha (Roll No.: 23098116780019)  
**Supervisor:** Ms. Kawaljeet Kaur, Assistant Professor, Department of Computer Science & Engineering  
**Department:** Computer Science & Engineering, B.Tech (2023–2027)  

---

## 1. Overview & Conversion Mapping

This guide provides a direct, publication-ready template to compress and convert the 60-page B.Tech Mini Project Report (`misc/HaqDaar_Mini_Project_Report_60pg.docx`) into the standard **IEEE 2-Column Conference / Transactions Paper Format** (typically 6 to 8 pages).

### Chapter-to-IEEE Section Mapping Matrix

| 60-Page Report Chapter | Corresponding IEEE Paper Section | Target Page Budget | Key Content Transferred |
| :--- | :--- | :--- | :--- |
| **Title, Prelims, Abstract** | **Title, Author Affiliations, Abstract, Index Terms** | 0.5 Page | Concise 200-word abstract, 6–8 index terms, candidate details. |
| **Chapter 1: Introduction** | **Section I: Introduction** | 1.0 Page | Civic entitlement gap, last-mile DBT frictions, core design contribution (*"AI Extracts, Rules Decide"*), paper organization. |
| **Chapter 2: Literature Survey** | **Section II: Related Work & Gap Analysis** | 0.75 Page | Evolution from portal era to AI era; comparative analysis with myScheme, Jan Soochna, UMANG. |
| **Chapter 3 & Chapter 4: Architecture & Design** | **Section III: System Architecture & Methodology** | 1.75 Pages | Dual-phase matching methodology, formal scoring formulation $S = \min(99, \max(0, \sum w_i f_i))$, privacy-by-design, Web Audio pipeline. |
| **Chapter 5: Implementation & Modules** | **Section IV: Implementation Details** | 1.25 Pages | Next.js 16 App Router, 233-scheme ontology, Fuse.js fuzzy index, 85-center CSC locator, Household Benefit Estimator. |
| **Chapter 6: Testing & Results** | **Section V: Experimental Evaluation & Results** | 1.0 Page | 100-scenario evaluation, 94.2% entity precision, 100% statutory rule adherence, 849 ms latency, confusion matrix/metrics. |
| **Chapter 7: Ethics & Challenges** | **Section VI: Societal Impact & Ethical Considerations** | 0.5 Page | Zero-PII storage, offline resilience, digital divide mitigation. |
| **Chapter 8: Conclusion & Future Scope** | **Section VII: Conclusion & Future Work** | 0.5 Page | Summary of contributions, CSC network integration, multilingual speech expandability. |
| **References** | **References** | 0.75 Page | 15–20 formal IEEE-styled citations ([1], [2], ...). |

---

## 2. Complete IEEE Format Paper Draft

*You can copy the markdown text below directly into Overleaf (`IEEEtran` documentclass) or paste into Microsoft Word using the standard IEEE Two-Column Template.*

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
India administers hundreds of central and state Direct Benefit Transfer (DBT) welfare schemes spanning agriculture, healthcare, scholarships, housing, and social security. Despite budgetary commitments exceeding billions of rupees, millions of eligible marginalized citizens remain disenfranchised due to bureaucratic friction, high portal complexity, linguistic exclusion, and low literacy. Existing digital interfaces mandate rigid, complex multi-step forms and prerequisite knowledge of scheme classifications. In this paper, we present **HaqDaar** (हक़दार, *“the rightful claimant”*), a voice-first, multilingual civic entitlement platform designed on the governing architectural tenet: **"AI Extracts, Deterministic Rules Decide."** The system captures natural voice inputs in Hindi, English, and colloquial Hinglish, dynamically parses demographic attributes into a structured profile, matches them against a curated knowledge base of 233 central and state schemes using a two-phase hybrid rule engine, and synthesizes plain-language actionable audio advisories. Evaluated across an empirical test suite of 100 diverse persona scenarios, HaqDaar achieves 94.2% entity extraction precision, 100% adherence to statutory eligibility ceilings, an end-to-end voice turnaround of 849 ms, and operates with zero personal identifiability storage (Privacy-by-Design). Furthermore, the platform integrates an 85-center Common Service Centre (CSC) directory and a multi-scheme household economic value estimator to bridge last-mile digital delivery.

**Index Terms**—Civic Technology, Multimodal AI, Voice Interface, Hybrid Rule Engine, Retrieval-Augmented Generation, Next.js, Privacy by Design, Welfare Schemes, Direct Benefit Transfer.

---

## I. Introduction
The Government of India and respective State administrations manage extensive welfare architectures intended to protect economically vulnerable populations and stimulate human capital formation. However, an entrenched systemic paradox persists: fiscal allocation does not guarantee beneficiary saturation. Citizens at the bottom of the economic pyramid face substantial discovery and transactional barriers:
1. **Linguistic and Textual Exclusion:** Portals are structured in formal bureaucratic jargon, predominantly in English or formal Sanskritised Hindi, excluding semi-literate demographics.
2. **Fragmented Dissemination:** Scheme guidelines are dispersed across central portals (e.g., myScheme, UMANG) and state departmental sites.
3. **Exploitative Intermediation:** The information vacuum fosters informal middlemen who levy illicit fees on vulnerable citizens for basic eligibility checks.

To overcome these structural hurdles, we introduce **HaqDaar**, an open-source, voice-first civic entitlement platform. Unlike naive end-to-end Large Language Model (LLM) implementations that are prone to hallucinating scheme qualifications or monetary disbursements, HaqDaar introduces a decoupled hybrid paradigm: conversational AI handles natural language understanding and natural voice synthesis, while a deterministic, audit-verifiable rule engine enforces statutory legal constraints (income ceilings, domicile, and age thresholds).

---

## II. Related Work & Gap Analysis
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

## III. System Architecture & Methodology

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

## IV. Implementation & Core Modules

### A. Scheme Knowledge Base
The platform embeds a structured ontology of **233 verified central and state schemes** (`schemes.json`), covering 14 core ministries including Agriculture, Healthcare, Rural Development, Education, and Labor. Each scheme record encapsulates statutory criteria, direct financial benefits, step-by-step procedures, and documentation checklists.

### B. Fast Fuzzy Search Subsystem
To enable instant keyword lookup across colloquial scheme variations and transliterated queries (e.g., "kisan credit", "ayushman card", "sukanya"), we implement Fuse.js client-side search. With multi-key weighted indexing, query resolution executes in $< 12\text{ ms}$ over the entire 233-scheme database without network roundtrips.

### C. Multi-Scheme Comparison & Household Benefit Estimator
To enable comparative decision-making, the platform introduces a 4-way side-by-side comparison matrix with 8 pre-configured national policy presets. The subsystem aggregates individual scheme allocations into a **Combined Household Economic Value** metric, estimating cumulative annual financial transfers, food grain entitlements, and subsidized credit access.

### D. Offline Common Service Centre (CSC) Geo-Directory
Recognizing that physical execution requires assisted touchpoints, HaqDaar integrates a localized directory of **85 verified Common Service Centres (Jan Seva Kendras)** across Indian states. Beneficiaries can filter centers by district, access Village Level Entrepreneur (VLE) contact data, and navigate directly via geo-coordinates.

---

## V. Experimental Evaluation & Results

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

## VI. Ethical AI, Privacy-by-Design & Zero-Overhead Architecture
HaqDaar enforces strict **Privacy-by-Design** principles:
* **No Aadhaar / Document Uploads:** The application does not solicit, process, or store sensitive identity credentials.
* **No Server-Side Tracking:** User profiles, saved schemes, and application checklists are retained purely in the client's local browser memory (`localStorage`).
* **Zero Database Overhead:** By leveraging optimized client-side JSON indexing, the platform scales statically without cloud database connection overhead or maintenance vulnerabilities.

---

## VII. Conclusion & Future Roadmap
HaqDaar demonstrates that the critical gap in public welfare delivery is not programmatic funding, but linguistic, cognitive, and procedural accessibility. By establishing a voice-first architecture guided by the principle of "AI Extracts, Deterministic Rules Decide," the system ensures both vernacular accessibility and 100% legal precision. Future milestones include direct automated integration with CSC Digital Seva Connect APIs, offline speech processing via on-device quantized models, and localized dialect expansion for tribal languages.

---

## References
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

---

## 3. How to Generate the PDF / IEEE Word Document

1. **Option A (Microsoft Word):**
   - Download the official IEEE Conference Template (`IEEE_CS_Template.dotx`).
   - Open Word, select the 2-Column layout.
   - Copy the sections above directly into the corresponding placeholder styles (`Title`, `Author`, `Abstract`, `Heading 1`, `Heading 2`, `Body Text`, `Table`, `References`).
2. **Option B (LaTeX / Overleaf):**
   - Create a new project in Overleaf with `\documentclass[conference]{IEEEtran}`.
   - Insert equations using LaTeX `$$ ... $$` math mode.
   - Tables use standard `\begin{table}[htbp] ... \end{table}`.
3. **Option C (Pandoc Direct Conversion):**
   ```bash
   pandoc misc/IEEE_REPORT_CONVERSION_GUIDE.md -o misc/HaqDaar_IEEE_Paper.pdf --pdf-engine=xelatex
   ```
