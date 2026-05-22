# SPEC_JOBS.md — Jobs Module
**Platform:** Mission Control Personal Productivity Platform
**Stack:** Next.js 15, TypeScript (strict), Tailwind CSS, tRPC, Prisma, Zustand, TanStack Query, Framer Motion, Playwright, Vercel AI SDK

---

## 1. Overview

The Jobs module is a unified job search and application management system that aggregates listings from multiple job boards via Playwright-powered scraping, applies AI-based fit scoring, and provides a Kanban board for tracking every application from "Wishlist" through "Offer" or "Rejection". The goal is to replace the chaotic mix of browser tabs, spreadsheets, and email threads that job seekers currently use, bringing everything into a single, intelligent Mission Control surface.

### Core Capabilities

| Capability | Description |
|---|---|
| Aggregated Job Feed | Scraped listings from LinkedIn, Indeed BR, Glassdoor, and Gupy |
| AI Fit Score | 0–100% match score based on job description vs. user skill profile |
| Application Kanban | Drag-and-drop board: Wishlist → Applied → Screening → Interview → Offer / Rejected |
| Cover Letter Generator | AI generates a tailored cover letter per job + profile |
| Interview Prep | AI generates likely interview questions from the job description |
| Company Research | AI-generated company summary from the JD and public data |
| Search Profiles | Saved search criteria; auto-scrapes every 2h for new matches |
| Notifications | New job alerts when listings match a saved search profile |

---

## 2. User Stories

### US-01 — Aggregated Job Discovery
**As a** job seeker,
**I want to** search for jobs across LinkedIn, Indeed, Glassdoor, and Gupy in a single feed,
**so that** I don't have to visit each site individually and risk missing listings.

**Acceptance Criteria:**
- Search results from all sources appear in a unified, deduplicated feed sorted by relevance
- Each card clearly shows the source platform (badge)
- Results are paginated with infinite scroll (20 items per page)
- Filters apply across all sources simultaneously

---

### US-02 — AI Fit Score
**As a** job seeker with a defined skill set,
**I want to** see an AI-calculated fit score on every job listing,
**so that** I can prioritize applications where I have the strongest match.

**Acceptance Criteria:**
- Fit score is displayed as a percentage badge (green ≥ 80%, yellow 50–79%, red < 50%)
- Clicking the score opens a breakdown: matching skills, skill gaps, and overall recommendation
- Score is recalculated if user updates their JobSearchProfile
- Score is computed lazily (on demand, not batch) to manage API costs

---

### US-03 — Application Tracking
**As a** user managing multiple applications,
**I want to** drag job cards between Kanban columns to reflect the current status of each application,
**so that** I have an accurate, real-time view of where I stand with each company.

**Acceptance Criteria:**
- Kanban columns: Wishlist, Applied, Screening, Interview, Offer, Rejected
- Drag-and-drop powered by `@dnd-kit/core` (keyboard accessible)
- Status change is optimistic — UI updates before server confirms
- Moving to "Applied" prompts user to set `appliedAt` date (defaults to today)
- Cards show: company logo, job title, days since applied, next follow-up date (if set)

---

### US-04 — Cover Letter Generation
**As a** user preparing an application,
**I want to** generate a personalized cover letter using AI,
**so that** I can write a compelling letter quickly without starting from scratch.

**Acceptance Criteria:**
- "Generate Cover Letter" button appears on the job detail panel
- AI reads the job description + user's JobSearchProfile (skills, experience summary)
- Letter streams token-by-token in an editable text area
- User can regenerate with a tone modifier: "more formal", "shorter", "startup-friendly"
- Generated letter is saved to the `JobApplication.notes` field

---

### US-05 — Interview Preparation
**As a** user preparing for an interview,
**I want to** receive a list of likely interview questions based on the job description,
**so that** I can prepare thoughtful answers before the meeting.

**Acceptance Criteria:**
- "Prep Interview" button appears on application cards in Interview column
- AI generates 10–15 questions: behavioral, technical, culture-fit
- Each question includes a hint: "Focus on your X experience"
- User can mark questions as "prepared" with a checkbox

---

### US-06 — Saved Search Profiles
**As a** user who knows what they're looking for,
**I want to** save my search criteria (skills, location, salary, remote preference),
**so that** Mission Control can automatically surface new matching jobs without me re-searching.

**Acceptance Criteria:**
- User can save multiple search profiles (e.g., "Frontend Remote", "Senior Engineer São Paulo")
- Each profile auto-triggers a scraping job every 2h via a background cron
- New matches generate a notification in the Mission Control notification center
- Profile includes: skills, locations, remote preference, salary range, job type

---

### US-07 — Company Research
**As a** user considering an application,
**I want to** quickly understand the company's culture, products, and reputation,
**so that** I can make an informed decision about whether to apply.

**Acceptance Criteria:**
- "Research Company" panel appears on any job detail view
- AI summarizes company from job description context + general knowledge (training data)
- Summary covers: company overview, culture signals, tech stack hints, growth stage (if evident)
- Disclaimer: info may be outdated; user should verify via official channels

---

### US-08 — Follow-Up Reminders
**As a** user who has submitted applications,
**I want to** set follow-up dates for each application,
**so that** Mission Control reminds me when to reach out if I haven't heard back.

**Acceptance Criteria:**
- "Set Follow-Up" date picker on each application card
- Overdue follow-ups highlighted in red on the Kanban board
- Notification fires on the follow-up date via the Mission Control notification system
- User can mark a follow-up as "done" to dismiss it

---

## 3. Sub-Pages

| Route | Component | Description |
|---|---|---|
| `/jobs` | Job Feed | Aggregated search + filters + job detail panel |
| `/jobs/saved` | Saved Jobs | Grid of saved jobs with fit scores + quick actions |
| `/jobs/tracker` | Kanban Board | Full-width drag-and-drop application tracker |

---

## 4. UI Layout

### 4.1 — Job Feed (`/jobs`) — 3-Column Layout

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  MISSION CONTROL                                          [+ New Profile] [Avatar] │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─ FILTERS SIDEBAR (~22%) ───────┐  ┌─ JOB LIST (~38%) ─────────────────────┐  │
│  │                                │  │                                        │  │
│  │  🔍 [Search jobs...      ]     │  │  234 jobs found  [Relevance ▾]         │  │
│  │  [🔄 Refresh now]              │  │                                        │  │
│  │                                │  │  ┌──────────────────────────────────┐  │  │
│  │  TECH STACK                    │  │  │ [Logo]  Senior Frontend Dev      │  │  │
│  │  ☐ React                       │  │  │         Nubank · São Paulo · R   │  │  │
│  │  ☑ TypeScript                  │  │  │         R$ 15k–20k · 3d ago      │  │  │
│  │  ☑ Node.js                     │  │  │  React TypeScript Next.js         │  │  │
│  │  ☐ Python                      │  │  │  [🔗 LinkedIn]  🟢 87% fit  [♡]   │  │  │
│  │  ☐ Java                        │  │  └──────────────────────────────────┘  │  │
│  │  ☐ Go                          │  │                                        │  │
│  │  [+ More]                      │  │  ┌──────────────────────────────────┐  │  │
│  │                                │  │  │ [Logo]  Full-Stack Engineer       │  │  │
│  │  WORK MODE                     │  │  │         Gupy · Remote · BR        │  │  │
│  │  ⦿ Remote                      │  │  │         R$ 12k–16k · 1d ago       │  │  │
│  │  ○ Hybrid                      │  │  │  Node.js TypeScript PostgreSQL    │  │  │
│  │  ○ On-site                     │  │  │  [🔗 Gupy]      🟡 62% fit  [♡]   │  │  │
│  │  ○ Any                         │  │  └──────────────────────────────────┘  │  │
│  │                                │  │                                        │  │
│  │  SALARY (BRL/month)            │  │  ┌──────────────────────────────────┐  │  │
│  │  [R$8k ══════════● R$25k]      │  │  │ [Logo]  React Developer           │  │  │
│  │  Min: R$8.000 Max: R$25.000    │  │  │         iFood · Hybrid · SP       │  │  │
│  │                                │  │  │         Not disclosed · 5d ago    │  │  │
│  │  DATE POSTED                   │  │  │  React Redux GraphQL               │  │  │
│  │  ○ Today                       │  │  │  [🔗 Indeed]    🟢 79% fit  [♡]   │  │  │
│  │  ⦿ This week                   │  │  └──────────────────────────────────┘  │  │
│  │  ○ This month                  │  │                                        │  │
│  │  ○ Any time                    │  │  [Load more (214 remaining)...]        │  │
│  │                                │  │                                        │  │
│  │  COMPANY SIZE                  │  └────────────────────────────────────────┘  │
│  │  ☐ Startup (1–50)              │                                              │
│  │  ☑ Scale-up (51–500)           │  ┌─ JOB DETAIL (~40%) ───────────────────┐  │
│  │  ☑ Enterprise (500+)           │  │                                        │  │
│  │                                │  │  [Company Logo]                        │  │
│  │  SOURCE                        │  │  Senior Frontend Developer             │  │
│  │  ☑ LinkedIn                    │  │  Nubank · São Paulo  🟢 Remote         │  │
│  │  ☑ Indeed                      │  │  Posted 3 days ago                     │  │
│  │  ☑ Glassdoor                   │  │  R$ 15.000 – R$ 20.000 / month         │  │
│  │  ☑ Gupy                        │  │                                        │  │
│  │                                │  │  [♡ Save]  [Apply →]  [📋 Track]       │  │
│  │  SAVED SEARCHES                │  │                                        │  │
│  │  ─────────────────────────     │  │  🤖 FIT SCORE: 87%                     │  │
│  │  • Frontend Remote             │  │  ✅ React, TypeScript, Next.js         │  │
│  │  • Senior SP                   │  │  ✅ 5+ years experience                │  │
│  │  [+ Save current search]       │  │  ⚠️  GraphQL (nice to have)            │  │
│  └────────────────────────────────┘  │  ❌ AWS (required — skill gap)         │  │
│                                      │                                        │  │
│                                      │  DESCRIPTION                           │  │
│                                      │  At Nubank, we believe that…           │  │
│                                      │  [... truncated, expand ▾]             │  │
│                                      │                                        │  │
│                                      │  REQUIRED SKILLS                       │  │
│                                      │  React  TypeScript  Next.js  AWS       │  │
│                                      │  GraphQL  CI/CD  5yr experience        │  │
│                                      │                                        │  │
│                                      │  AI ACTIONS                            │  │
│                                      │  [✍️ Generate Cover Letter]            │  │
│                                      │  [❓ Interview Prep]                   │  │
│                                      │  [🏢 Research Company]                 │  │
│                                      └────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 — Saved Jobs (`/jobs/saved`)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  ← Jobs Feed            Saved Jobs (14)                    [Sort: Fit Score ▾]   │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────┐   │
│  │ [Logo]          │ │ [Logo]          │ │ [Logo]          │ │ [Logo]      │   │
│  │ Sr. Frontend    │ │ Full-Stack      │ │ React Dev       │ │ UI Engineer │   │
│  │ Nubank          │ │ Gupy            │ │ iFood           │ │ Mercado L.  │   │
│  │ 🟢 87% fit      │ │ 🟡 62% fit      │ │ 🟢 79% fit      │ │ 🟢 91% fit  │   │
│  │ Remote          │ │ Remote          │ │ Hybrid SP       │ │ Hybrid SP   │   │
│  │ R$15-20k        │ │ R$12-16k        │ │ N/A             │ │ R$18-25k    │   │
│  │ Notes: Strong   │ │                 │ │ Notes: Team     │ │             │   │
│  │ [Apply] [Track] │ │ [Apply] [Track] │ │ [Apply] [Track] │ │[Apply][Trk] │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────┘   │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 — Application Tracker (`/jobs/tracker`) — Kanban Board

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  Application Tracker                                [+ Add Job] [Filter: All ▾] [This month] │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                              │
│ ┌──WISHLIST (3)──┐ ┌──APPLIED (5)───┐ ┌──SCREENING (2)─┐ ┌──INTERVIEW (2)─┐ ┌──OFFER (1)─┐ │
│ │                │ │                │ │                │ │                │ │            │ │
│ │ ┌────────────┐ │ │ ┌────────────┐ │ │ ┌────────────┐ │ │ ┌────────────┐ │ │ ┌────────┐ │ │
│ │ │[Logo]      │ │ │ │[Logo]      │ │ │ │[Logo]      │ │ │ │[Logo]      │ │ │ │[Logo]  │ │ │
│ │ │Sr. Frontend│ │ │ │Full-Stack  │ │ │ │React Dev   │ │ │ │UI Engineer │ │ │ │CTO Eng │ │ │
│ │ │Nubank      │ │ │ │Gupy        │ │ │ │iFood       │ │ │ │Mercado L.  │ │ │ │Startco │ │ │
│ │ │🟢 87% fit  │ │ │ │Applied 3d  │ │ │ │Screening   │ │ │ │Interview   │ │ │ │🎉 Offer│ │ │
│ │ │            │ │ │ │📅 Follow-up│ │ │ │in 2d       │ │ │ │Tomorrow    │ │ │ │R$22k   │ │ │
│ │ │[Apply →]   │ │ │ │in 2 days   │ │ │ │            │ │ │ │[Interview  │ │ │ │[Accept]│ │ │
│ │ └────────────┘ │ │ └────────────┘ │ │ └────────────┘ │ │ │ Prep →]    │ │ │ [Decli-│ │ │
│ │                │ │                │ │                │ │ └────────────┘ │ │ │ne]     │ │ │
│ │ ┌────────────┐ │ │ ┌────────────┐ │ │ ┌────────────┐ │ │                │ │ └────────┘ │ │
│ │ │[Logo]      │ │ │ │[Logo]      │ │ │ │[Logo]      │ │ │ ┌────────────┐ │ │            │ │
│ │ │React Dev   │ │ │ │Node.js Dev │ │ │ │Backend Eng │ │ │ │[Logo]      │ │ │            │ │
│ │ │Stripe      │ │ │ │Pismo       │ │ │ │PicPay      │ │ │ │Sr. Dev     │ │ │            │ │
│ │ │🟡 55% fit  │ │ │ │Applied 7d  │ │ │ │HR call     │ │ │ │Loft        │ │ │            │ │
│ │ │            │ │ │ │⚠️ Overdue  │ │ │ │next Mon    │ │ │ │2nd round   │ │ │            │ │
│ │ └────────────┘ │ │ └────────────┘ │ │ └────────────┘ │ │ │next week   │ │ │            │ │
│ │                │ │                │ │                │ │ └────────────┘ │ │            │ │
│ │ [+ Add]        │ │ [+ Add]        │ │ [+ Add]        │ │ [+ Add]        │ │ [+ Add]    │ │
│ └────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘ └────────────┘ │
│                                                                                              │
│ ┌──REJECTED (4)──────────────────────────────────────────────────────────────────────────┐  │
│ │ [Logo] Backend Eng · Rappi · Rejected 2w ago · ❌ No feedback                          │  │
│ │ [Logo] Fullstack · C6 Bank · Rejected 1m ago · Note: "Culture fit"                     │  │
│ └────────────────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Data Model (Prisma Schema)

```prisma
// ─── JobPost ──────────────────────────────────────────────────────────────────

model JobPost {
  id           String   @id @default(cuid())
  title        String
  company      String
  companyLogo  String?  // URL
  location     String?
  remote       Boolean  @default(false)
  hybrid       Boolean  @default(false)
  salaryMin    Float?   // monthly BRL
  salaryMax    Float?
  currency     String   @default("BRL")
  description  String   @db.Text
  requirements String?  @db.Text
  skills       String[]
  jobType      String[] // ["full-time", "contract", "internship"]
  source       JobSource
  sourceUrl    String   @unique
  sourceId     String?  // original platform ID for dedup
  postedAt     DateTime?
  scrapedAt    DateTime @default(now())
  isActive     Boolean  @default(true)
  expiresAt    DateTime? // estimated listing expiry
  companySize  String?  // "startup" | "scale-up" | "enterprise"

  savedByUsers    SavedJob[]
  applications    JobApplication[]

  @@index([source, isActive])
  @@index([skills])
  @@index([scrapedAt])
  @@index([remote])
}

enum JobSource {
  LINKEDIN
  INDEED
  GLASSDOOR
  GUPY
  MANUAL // user added manually
}

// ─── SavedJob ─────────────────────────────────────────────────────────────────

model SavedJob {
  id        String   @id @default(cuid())
  userId    String
  jobPostId String
  savedAt   DateTime @default(now())
  notes     String?  @db.Text
  fitScore  Int?     // 0–100, AI computed

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  jobPost JobPost @relation(fields: [jobPostId], references: [id], onDelete: Cascade)

  @@unique([userId, jobPostId])
  @@index([userId, savedAt])
  @@index([userId, fitScore])
}

// ─── JobApplication ───────────────────────────────────────────────────────────

model JobApplication {
  id             String          @id @default(cuid())
  userId         String
  jobPostId      String
  status         KanbanStatus    @default(WISHLIST)
  appliedAt      DateTime?
  notes          String?         @db.Text  // stores generated cover letter here too
  nextFollowUp   DateTime?
  interviewDates DateTime[]
  offerAmount    Float?
  rejectedAt     DateTime?
  rejectionNote  String?
  columnPosition Int             @default(0) // order within the Kanban column
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  jobPost JobPost @relation(fields: [jobPostId], references: [id], onDelete: Cascade)

  @@unique([userId, jobPostId])
  @@index([userId, status])
  @@index([userId, nextFollowUp])
}

enum KanbanStatus {
  WISHLIST
  APPLIED
  SCREENING
  INTERVIEW
  OFFER
  REJECTED
}

// ─── JobSearchProfile ─────────────────────────────────────────────────────────

model JobSearchProfile {
  id            String   @id @default(cuid())
  userId        String
  name          String                    // "Frontend Remote", "Senior SP"
  skills        String[]
  locations     String[]
  remote        Boolean  @default(false)
  hybrid        Boolean  @default(false)
  salaryMin     Float?
  salaryMax     Float?
  currency      String   @default("BRL")
  jobTypes      String[] // ["full-time", "contract"]
  sources       JobSource[] // which boards to search
  isActive      Boolean  @default(true)
  lastSearched  DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isActive])
  @@index([lastSearched])
}
```

### TypeScript Types

```typescript
// Types used across the Jobs module

interface JobPostPreview {
  id: string;
  title: string;
  company: string;
  companyLogo: string | null;
  location: string | null;
  remote: boolean;
  hybrid: boolean;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  skills: string[];
  source: JobSource;
  postedAt: Date | null;
  fitScore?: number;   // present if user is authenticated and profile exists
  isSaved?: boolean;
  hasApplication?: boolean;
}

interface FitScoreBreakdown {
  score: number;                     // 0–100
  matchedSkills: string[];           // skills in both JD and user profile
  skillGaps: string[];               // required by JD but absent from profile
  niceToHaveMatches: string[];       // optional JD skills user has
  recommendation: 'apply' | 'learn-first' | 'stretch';
  summary: string;                   // one-sentence AI explanation
}

interface KanbanColumn {
  status: KanbanStatus;
  label: string;
  color: string;
  applications: JobApplicationCard[];
}

interface JobApplicationCard {
  id: string;
  jobPost: JobPostPreview;
  status: KanbanStatus;
  appliedAt: Date | null;
  nextFollowUp: Date | null;
  isFollowUpOverdue: boolean;
  daysSinceApplied: number | null;
  columnPosition: number;
}

type KanbanStatusColor = {
  [K in KanbanStatus]: string;
};

const STATUS_META: { [K in KanbanStatus]: { label: string; color: string; icon: string } } = {
  WISHLIST:   { label: 'Wishlist',   color: 'bg-slate-100 border-slate-300',    icon: '⭐' },
  APPLIED:    { label: 'Applied',    color: 'bg-blue-50 border-blue-300',       icon: '📤' },
  SCREENING:  { label: 'Screening',  color: 'bg-yellow-50 border-yellow-300',   icon: '📞' },
  INTERVIEW:  { label: 'Interview',  color: 'bg-orange-50 border-orange-300',   icon: '🎙️' },
  OFFER:      { label: 'Offer',      color: 'bg-green-50 border-green-300',     icon: '🎉' },
  REJECTED:   { label: 'Rejected',   color: 'bg-red-50 border-red-300',         icon: '❌' },
};
```

---

## 6. Web Scraping Sources

### 6.1 — Scraping Sources Overview

| Source | Approach | Auth Required | Rate Limit | Notes |
|---|---|---|---|---|
| LinkedIn Jobs | Public search URL | No (limited results) | 1 req/5s | Use public `/jobs/search` endpoint; no login needed for first page |
| Indeed Brazil | DOM scraping | No | 1 req/3s | JSON-LD on listings; avoid JS-heavy pages |
| Glassdoor | DOM scraping | No (basic) | 1 req/5s | Some data requires login; scrape public listings only |
| Gupy | API + DOM | No | 1 req/2s | Gupy has a semi-public API for Brazilian companies |

All scrapers:
- Check and respect `robots.txt` on startup (cached 1h)
- Use a realistic User-Agent (browser string)
- Never bypass CAPTCHA
- Scrape only publicly visible listings
- Refresh saved profiles every 2h via cron job (`/api/cron/refresh-jobs`)

### 6.2 — Scraper Architecture

```typescript
// src/lib/scrapers/job-scraper/base-job-scraper.ts

import { chromium, Browser, Page } from 'playwright';
import { RateLimiter } from '../../rate-limiter';

export interface ScrapedJobPreview {
  title: string;
  company: string;
  companyLogo?: string;
  location?: string;
  remote: boolean;
  hybrid: boolean;
  salaryMin?: number;
  salaryMax?: number;
  skills: string[];
  sourceUrl: string;
  sourceId?: string;
  postedAt?: Date;
  description?: string;
}

export abstract class BaseJobScraper {
  protected browser: Browser | null = null;
  protected readonly source: JobSource;
  protected readonly domain: string;
  protected rateLimiter: RateLimiter;

  constructor(source: JobSource, domain: string, rps: number) {
    this.source = source;
    this.domain = domain;
    this.rateLimiter = new RateLimiter({ requestsPerSecond: rps });
  }

  async init(): Promise<void> {
    this.browser = await chromium.launch({ headless: true });
  }

  async teardown(): Promise<void> {
    await this.browser?.close();
  }

  protected async openPage(url: string): Promise<Page> {
    await this.rateLimiter.wait();
    const page = await this.browser!.newPage();
    await page.setExtraHTTPHeaders({
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20_000 });
    return page;
  }

  abstract search(query: string, filters: JobSearchFilters): Promise<ScrapedJobPreview[]>;
  abstract getJobDetail(url: string): Promise<Partial<ScrapedJobPreview>>;
}

// src/lib/scrapers/job-scraper/linkedin-scraper.ts

export class LinkedInJobScraper extends BaseJobScraper {
  constructor() {
    super('LINKEDIN', 'linkedin.com', 0.2); // 1 req/5s
  }

  async search(query: string, filters: JobSearchFilters): Promise<ScrapedJobPreview[]> {
    const params = new URLSearchParams({
      keywords: query,
      location: filters.locations?.[0] ?? 'Brazil',
      f_WT: filters.remote ? '2' : '',        // 2 = remote
      f_SB2: filters.salaryMin?.toString() ?? '',
      start: '0',
    });

    const page = await this.openPage(
      `https://www.linkedin.com/jobs/search/?${params.toString()}`
    );

    await page.waitForSelector('.jobs-search__results-list', { timeout: 10_000 });

    const jobs = await page.evaluate(() => {
      const cards = document.querySelectorAll('.jobs-search__results-list li');
      return Array.from(cards).slice(0, 20).map((card) => ({
        title: card.querySelector('.base-search-card__title')?.textContent?.trim() ?? '',
        company: card.querySelector('.base-search-card__subtitle')?.textContent?.trim() ?? '',
        location: card.querySelector('.job-search-card__location')?.textContent?.trim() ?? '',
        sourceUrl: (card.querySelector('a.base-card__full-link') as HTMLAnchorElement)?.href ?? '',
        postedAtText: card.querySelector('time')?.getAttribute('datetime') ?? '',
        companyLogo: (card.querySelector('.artdeco-entity-image') as HTMLImageElement)?.src ?? '',
      }));
    });

    await page.close();

    return jobs.map((j) => ({
      ...j,
      remote: j.location.toLowerCase().includes('remote') || j.location.toLowerCase().includes('remoto'),
      hybrid: j.location.toLowerCase().includes('hybrid') || j.location.toLowerCase().includes('híbrido'),
      skills: [], // fetched in getJobDetail
      postedAt: j.postedAtText ? new Date(j.postedAtText) : undefined,
    }));
  }

  async getJobDetail(url: string): Promise<Partial<ScrapedJobPreview>> {
    const page = await this.openPage(url);

    // LinkedIn exposes JSON-LD on job pages
    const detail = await page.evaluate(() => {
      const jsonLd = document.querySelector('script[type="application/ld+json"]');
      if (jsonLd) {
        const data = JSON.parse(jsonLd.textContent ?? '{}');
        return {
          description: data.description ?? '',
          skills: (data.skills ?? []).map((s: { name: string }) => s.name),
        };
      }

      return {
        description: document.querySelector('.show-more-less-html__markup')?.innerHTML ?? '',
        skills: [],
      };
    });

    await page.close();
    return detail;
  }
}

// src/lib/scrapers/job-scraper/gupy-scraper.ts
// Gupy has a semi-public REST API used by embedded career pages

export class GupyScraper extends BaseJobScraper {
  constructor() {
    super('GUPY', 'portal.gupy.io', 0.5); // 1 req/2s
  }

  async search(query: string, filters: JobSearchFilters): Promise<ScrapedJobPreview[]> {
    await this.rateLimiter.wait();

    // Gupy's public API endpoint
    const response = await fetch(
      `https://portal.gupy.io/api/job?name=${encodeURIComponent(query)}&isRemoteWork=${filters.remote ?? false}&limit=20`,
      { headers: { 'Accept': 'application/json', 'Accept-Language': 'pt-BR' } }
    );

    if (!response.ok) throw new Error(`Gupy API error: ${response.status}`);

    const data = await response.json() as GupySearchResponse;

    return data.data.map((job) => ({
      title: job.name,
      company: job.company.name,
      companyLogo: job.company.logoUrl,
      location: job.city ?? job.state ?? 'Brazil',
      remote: job.isRemoteWork,
      hybrid: job.workplaceType === 'hybrid',
      sourceUrl: `https://portal.gupy.io/job-offer/${job.id}`,
      sourceId: String(job.id),
      postedAt: new Date(job.publishedDate),
      skills: job.skills?.map((s) => s.name) ?? [],
      description: job.description,
    }));
  }

  async getJobDetail(url: string): Promise<Partial<ScrapedJobPreview>> {
    // Gupy job IDs are in the URL; call API directly
    const idMatch = url.match(/\/job-offer\/(\d+)/);
    if (!idMatch) return {};

    const response = await fetch(`https://portal.gupy.io/api/job/${idMatch[1]}`);
    const job = await response.json() as GupyJobDetail;

    return {
      description: job.description,
      requirements: job.prerequisites,
      skills: job.skills?.map((s) => s.name) ?? [],
      salaryMin: job.salaryFrom,
      salaryMax: job.salaryTo,
    };
  }
}
```

### 6.3 — Caching and Deduplication

```typescript
// src/lib/scrapers/job-scraper/job-cache.ts

export async function persistScrapedJobs(
  jobs: ScrapedJobPreview[],
  source: JobSource
): Promise<{ created: number; skipped: number }> {
  let created = 0;
  let skipped = 0;

  for (const job of jobs) {
    // Deduplicate by sourceUrl
    const existing = await prisma.jobPost.findUnique({
      where: { sourceUrl: job.sourceUrl },
    });

    if (existing) {
      // Update scrapedAt to keep listing "fresh"
      await prisma.jobPost.update({
        where: { id: existing.id },
        data: { scrapedAt: new Date(), isActive: true },
      });
      skipped++;
      continue;
    }

    await prisma.jobPost.create({
      data: {
        ...job,
        source,
        scrapedAt: new Date(),
      },
    });
    created++;
  }

  return { created, skipped };
}
```

### 6.4 — Scheduled Scraping (Cron)

```typescript
// src/app/api/cron/refresh-jobs/route.ts
// Triggered by Vercel Cron (every 2h via vercel.json)

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET() {
  // Verify cron secret
  const h = await headers();
  if (h.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Find all active search profiles not searched in the last 2h
  const staleProfiles = await prisma.jobSearchProfile.findMany({
    where: {
      isActive: true,
      OR: [
        { lastSearched: null },
        { lastSearched: { lt: new Date(Date.now() - 2 * 60 * 60 * 1000) } },
      ],
    },
  });

  const results = [];

  for (const profile of staleProfiles) {
    const scrapers = buildScrapers(profile.sources);
    const query = profile.skills.slice(0, 3).join(' '); // top 3 skills as query

    const filters: JobSearchFilters = {
      remote: profile.remote,
      hybrid: profile.hybrid,
      locations: profile.locations,
      salaryMin: profile.salaryMin ?? undefined,
    };

    const jobs = await Promise.allSettled(
      scrapers.map((s) => s.search(query, filters))
    );

    const allJobs = jobs
      .filter((r): r is PromiseFulfilledResult<ScrapedJobPreview[]> => r.status === 'fulfilled')
      .flatMap((r) => r.value);

    const { created } = await persistScrapedJobs(allJobs, 'LINKEDIN'); // simplified

    if (created > 0) {
      // Notify user
      await sendJobAlert(profile.userId, created, profile.name);
    }

    await prisma.jobSearchProfile.update({
      where: { id: profile.id },
      data: { lastSearched: new Date() },
    });

    results.push({ profileId: profile.id, newJobs: created });
  }

  return NextResponse.json({ refreshed: staleProfiles.length, results });
}
```

---

## 7. tRPC Procedures

```typescript
// src/server/routers/jobs.ts

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';

const JobFiltersSchema = z.object({
  query: z.string().optional(),
  skills: z.array(z.string()).optional(),
  locations: z.array(z.string()).optional(),
  remote: z.boolean().optional(),
  hybrid: z.boolean().optional(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  sources: z.array(z.nativeEnum(JobSource)).optional(),
  companySize: z.array(z.string()).optional(),
  datePosted: z.enum(['today', 'week', 'month', 'any']).optional(),
  jobTypes: z.array(z.string()).optional(),
});

export const jobsRouter = createTRPCRouter({

  // ── Search & Discovery ─────────────────────────────────────────────────────

  searchJobs: protectedProcedure
    .input(z.object({
      filters: JobFiltersSchema,
      cursor: z.string().optional(),
      limit: z.number().int().min(1).max(50).default(20),
    }))
    .query(async ({ input, ctx }) => {
      const { filters, cursor, limit } = input;

      const where: Prisma.JobPostWhereInput = {
        isActive: true,
        ...(filters.remote !== undefined ? { remote: filters.remote } : {}),
        ...(filters.hybrid !== undefined ? { hybrid: filters.hybrid } : {}),
        ...(filters.sources?.length ? { source: { in: filters.sources } } : {}),
        ...(filters.skills?.length ? {
          skills: { hasSome: filters.skills },
        } : {}),
        ...(filters.salaryMin ? { salaryMin: { gte: filters.salaryMin } } : {}),
        ...(filters.salaryMax ? { salaryMax: { lte: filters.salaryMax } } : {}),
        ...(filters.query ? {
          OR: [
            { title: { contains: filters.query, mode: 'insensitive' } },
            { company: { contains: filters.query, mode: 'insensitive' } },
            { description: { contains: filters.query, mode: 'insensitive' } },
          ],
        } : {}),
        ...(filters.datePosted && filters.datePosted !== 'any' ? {
          scrapedAt: { gte: getDateFilter(filters.datePosted) },
        } : {}),
      };

      const jobs = await ctx.prisma.jobPost.findMany({
        where,
        orderBy: { scrapedAt: 'desc' },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        include: {
          savedByUsers: {
            where: { userId: ctx.session.user.id },
            select: { fitScore: true },
          },
          applications: {
            where: { userId: ctx.session.user.id },
            select: { status: true },
          },
        },
      });

      const hasMore = jobs.length > limit;
      const page = hasMore ? jobs.slice(0, -1) : jobs;

      return {
        jobs: page.map((j) => ({
          ...j,
          fitScore: j.savedByUsers[0]?.fitScore ?? null,
          isSaved: j.savedByUsers.length > 0,
          applicationStatus: j.applications[0]?.status ?? null,
        })),
        nextCursor: hasMore ? page[page.length - 1]!.id : undefined,
      };
    }),

  // ── Save / Unsave ──────────────────────────────────────────────────────────

  saveJob: protectedProcedure
    .input(z.object({
      jobPostId: z.string().cuid(),
      notes: z.string().max(1000).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.savedJob.upsert({
        where: {
          userId_jobPostId: {
            userId: ctx.session.user.id,
            jobPostId: input.jobPostId,
          },
        },
        create: {
          userId: ctx.session.user.id,
          jobPostId: input.jobPostId,
          notes: input.notes,
        },
        update: { notes: input.notes },
      });
    }),

  unsaveJob: protectedProcedure
    .input(z.object({ jobPostId: z.string().cuid() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.savedJob.delete({
        where: {
          userId_jobPostId: {
            userId: ctx.session.user.id,
            jobPostId: input.jobPostId,
          },
        },
      });
    }),

  getSavedJobs: protectedProcedure
    .input(z.object({
      sortBy: z.enum(['savedAt', 'fitScore', 'postedAt']).default('savedAt'),
      cursor: z.string().optional(),
      limit: z.number().int().min(1).max(50).default(20),
    }))
    .query(async ({ input, ctx }) => {
      return ctx.prisma.savedJob.findMany({
        where: { userId: ctx.session.user.id },
        include: { jobPost: true },
        orderBy: input.sortBy === 'fitScore'
          ? { fitScore: 'desc' }
          : { savedAt: 'desc' },
        take: input.limit,
        cursor: input.cursor ? { id: input.cursor } : undefined,
      });
    }),

  // ── Application Kanban ─────────────────────────────────────────────────────

  getApplications: protectedProcedure
    .input(z.object({
      status: z.nativeEnum(KanbanStatus).optional(),
    }))
    .query(async ({ input, ctx }) => {
      const applications = await ctx.prisma.jobApplication.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input.status ? { status: input.status } : {}),
        },
        include: { jobPost: true },
        orderBy: [{ status: 'asc' }, { columnPosition: 'asc' }],
      });

      // Group into Kanban columns
      const columns: KanbanColumn[] = Object.values(KanbanStatus).map((status) => ({
        status,
        label: STATUS_META[status].label,
        color: STATUS_META[status].color,
        applications: applications
          .filter((a) => a.status === status)
          .map((a) => ({
            ...a,
            isFollowUpOverdue:
              !!a.nextFollowUp && a.nextFollowUp < new Date(),
            daysSinceApplied: a.appliedAt
              ? Math.floor((Date.now() - a.appliedAt.getTime()) / 86_400_000)
              : null,
          })),
      }));

      return columns;
    }),

  createApplication: protectedProcedure
    .input(z.object({
      jobPostId: z.string().cuid(),
      status: z.nativeEnum(KanbanStatus).default('WISHLIST'),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.jobApplication.create({
        data: {
          userId: ctx.session.user.id,
          jobPostId: input.jobPostId,
          status: input.status,
          notes: input.notes,
          appliedAt: input.status === 'APPLIED' ? new Date() : undefined,
        },
        include: { jobPost: true },
      });
    }),

  updateApplicationStatus: protectedProcedure
    .input(z.object({
      applicationId: z.string().cuid(),
      status: z.nativeEnum(KanbanStatus),
      columnPosition: z.number().int().nonnegative().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const updates: Prisma.JobApplicationUpdateInput = {
        status: input.status,
        ...(input.columnPosition !== undefined ? { columnPosition: input.columnPosition } : {}),
      };

      // Auto-set dates based on status transitions
      if (input.status === 'APPLIED') updates.appliedAt = new Date();
      if (input.status === 'REJECTED') updates.rejectedAt = new Date();
      if (input.status === 'OFFER') updates.offerAmount = undefined; // user fills in separately

      return ctx.prisma.jobApplication.update({
        where: { id: input.applicationId, userId: ctx.session.user.id },
        data: updates,
      });
    }),

  addNote: protectedProcedure
    .input(z.object({
      applicationId: z.string().cuid(),
      notes: z.string().max(5000),
    }))
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.jobApplication.update({
        where: { id: input.applicationId, userId: ctx.session.user.id },
        data: { notes: input.notes },
      });
    }),

  setFollowUp: protectedProcedure
    .input(z.object({
      applicationId: z.string().cuid(),
      date: z.string().datetime().nullable(),
    }))
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.jobApplication.update({
        where: { id: input.applicationId, userId: ctx.session.user.id },
        data: { nextFollowUp: input.date ? new Date(input.date) : null },
      });
    }),

  // ── Search Profile ─────────────────────────────────────────────────────────

  getSearchProfile: protectedProcedure
    .input(z.object({ profileId: z.string().cuid().optional() }))
    .query(async ({ input, ctx }) => {
      if (input.profileId) {
        return ctx.prisma.jobSearchProfile.findUniqueOrThrow({
          where: { id: input.profileId, userId: ctx.session.user.id },
        });
      }
      return ctx.prisma.jobSearchProfile.findMany({
        where: { userId: ctx.session.user.id, isActive: true },
        orderBy: { createdAt: 'desc' },
      });
    }),

  updateSearchProfile: protectedProcedure
    .input(z.object({
      profileId: z.string().cuid().optional(),
      name: z.string().min(1).max(100),
      skills: z.array(z.string()).min(1).max(30),
      locations: z.array(z.string()).max(10),
      remote: z.boolean(),
      hybrid: z.boolean(),
      salaryMin: z.number().positive().optional(),
      salaryMax: z.number().positive().optional(),
      jobTypes: z.array(z.string()),
      sources: z.array(z.nativeEnum(JobSource)),
    }))
    .mutation(async ({ input, ctx }) => {
      const { profileId, ...data } = input;

      if (profileId) {
        return ctx.prisma.jobSearchProfile.update({
          where: { id: profileId, userId: ctx.session.user.id },
          data,
        });
      }

      return ctx.prisma.jobSearchProfile.create({
        data: { ...data, userId: ctx.session.user.id },
      });
    }),

  // ── AI Features ────────────────────────────────────────────────────────────

  getAIFitScore: protectedProcedure
    .input(z.object({
      jobPostId: z.string().cuid(),
      profileId: z.string().cuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      const [job, profile] = await Promise.all([
        ctx.prisma.jobPost.findUniqueOrThrow({ where: { id: input.jobPostId } }),
        ctx.prisma.jobSearchProfile.findUniqueOrThrow({
          where: { id: input.profileId, userId: ctx.session.user.id },
        }),
      ]);

      const result = await generateObject({
        model: openai('gpt-4o-mini'),
        schema: z.object({
          score: z.number().int().min(0).max(100),
          matchedSkills: z.array(z.string()),
          skillGaps: z.array(z.string()),
          niceToHaveMatches: z.array(z.string()),
          recommendation: z.enum(['apply', 'learn-first', 'stretch']),
          summary: z.string().max(200),
        }),
        prompt: `Evaluate job fit.
          Job title: ${job.title} at ${job.company}
          Job description: ${job.description?.slice(0, 2000)}
          Required skills listed: ${job.skills.join(', ')}
          
          Candidate skills: ${profile.skills.join(', ')}
          Candidate preferences: remote=${profile.remote}, locations=${profile.locations.join(', ')}
          
          Return a fit score 0-100, skill analysis, and a one-sentence recommendation.`,
      });

      // Cache fit score on SavedJob
      await ctx.prisma.savedJob.upsert({
        where: {
          userId_jobPostId: { userId: ctx.session.user.id, jobPostId: input.jobPostId },
        },
        create: {
          userId: ctx.session.user.id,
          jobPostId: input.jobPostId,
          fitScore: result.object.score,
        },
        update: { fitScore: result.object.score },
      });

      return result.object;
    }),

  generateCoverLetter: protectedProcedure
    .input(z.object({
      jobPostId: z.string().cuid(),
      profileId: z.string().cuid(),
      tone: z.enum(['professional', 'conversational', 'formal', 'startup-friendly']).default('professional'),
      length: z.enum(['brief', 'standard', 'detailed']).default('standard'),
    }))
    .mutation(async ({ input, ctx }) => {
      const [job, profile] = await Promise.all([
        ctx.prisma.jobPost.findUniqueOrThrow({ where: { id: input.jobPostId } }),
        ctx.prisma.jobSearchProfile.findUniqueOrThrow({
          where: { id: input.profileId, userId: ctx.session.user.id },
        }),
      ]);

      const { textStream } = await streamText({
        model: anthropic('claude-3-5-sonnet-20241022'),
        system: `You are an expert cover letter writer. Write compelling, specific cover letters
          that highlight genuine skill matches without being generic.
          Tone: ${input.tone}. Length: ${input.length} (brief=2 paragraphs, standard=3-4, detailed=5+).
          Do NOT use clichés like "I am excited to apply" or "I am a team player".
          Always start with a strong, specific opening.`,
        prompt: `Write a cover letter for this job:
          Company: ${job.company}
          Title: ${job.title}
          Description: ${job.description?.slice(0, 1500)}
          
          Candidate skills: ${profile.skills.join(', ')}
          Candidate locations: ${profile.locations.join(', ')}`,
      });

      return textStream;
    }),

  generateInterviewPrep: protectedProcedure
    .input(z.object({
      applicationId: z.string().cuid(),
    }))
    .query(async ({ input, ctx }) => {
      const application = await ctx.prisma.jobApplication.findUniqueOrThrow({
        where: { id: input.applicationId, userId: ctx.session.user.id },
        include: { jobPost: true },
      });

      const result = await generateObject({
        model: anthropic('claude-3-5-sonnet-20241022'),
        schema: z.object({
          behavioral: z.array(z.object({
            question: z.string(),
            hint: z.string(),
            framework: z.string().optional(), // "STAR method", "PAR method"
          })).max(5),
          technical: z.array(z.object({
            question: z.string(),
            hint: z.string(),
            difficulty: z.enum(['junior', 'mid', 'senior']),
          })).max(5),
          cultureFit: z.array(z.object({
            question: z.string(),
            hint: z.string(),
          })).max(3),
          roleSpecific: z.array(z.object({
            question: z.string(),
            hint: z.string(),
          })).max(3),
        }),
        prompt: `Generate interview questions for:
          Job: ${application.jobPost.title} at ${application.jobPost.company}
          Job Description: ${application.jobPost.description?.slice(0, 2000)}
          Required Skills: ${application.jobPost.skills.join(', ')}
          
          Create realistic questions the interviewer is likely to ask.
          For technical questions, focus on the skills listed.
          For behavioral, use common STAR-format questions relevant to the role.`,
      });

      return result.object;
    }),

  getCompanyResearch: protectedProcedure
    .input(z.object({ jobPostId: z.string().cuid() }))
    .query(async ({ input, ctx }) => {
      const job = await ctx.prisma.jobPost.findUniqueOrThrow({
        where: { id: input.jobPostId },
      });

      const result = await generateObject({
        model: openai('gpt-4o'),
        schema: z.object({
          overview: z.string(),
          cultureSignals: z.array(z.string()),
          techStackHints: z.array(z.string()),
          companyStage: z.string(), // "Startup", "Scale-up", "Enterprise"
          prosFromJD: z.array(z.string()),
          questionsToAsk: z.array(z.string()),
          disclaimer: z.string(),
        }),
        prompt: `Research this company based on the job posting and your training data:
          Company: ${job.company}
          Job: ${job.title}
          Job Description: ${job.description?.slice(0, 2000)}
          
          Provide an overview, culture signals from the JD language, tech stack hints,
          estimated company stage, positive signals, and 3 smart questions to ask the interviewer.
          Include a disclaimer that info may be outdated.`,
      });

      return result.object;
    }),

  triggerJobScrape: protectedProcedure
    .input(z.object({ profileId: z.string().cuid() }))
    .mutation(async ({ input, ctx }) => {
      const profile = await ctx.prisma.jobSearchProfile.findUniqueOrThrow({
        where: { id: input.profileId, userId: ctx.session.user.id },
      });

      // Kick off background scraping
      // In production: queue via Inngest/Trigger.dev
      // For simplicity here: inline (will be slow on large profiles)
      const scrapers = buildScrapers(profile.sources);
      const query = profile.skills.slice(0, 3).join(' ');
      const filters = buildFilters(profile);

      const results = await Promise.allSettled(
        scrapers.map((s) => s.search(query, filters))
      );

      const newJobs = results
        .filter((r): r is PromiseFulfilledResult<ScrapedJobPreview[]> => r.status === 'fulfilled')
        .flatMap((r) => r.value);

      const { created } = await persistScrapedJobs(newJobs, 'LINKEDIN');

      await ctx.prisma.jobSearchProfile.update({
        where: { id: profile.id },
        data: { lastSearched: new Date() },
      });

      return { newJobsFound: created };
    }),
});
```

---

## 8. AI Features

### 8.1 — Fit Score Display Component

```typescript
// src/components/jobs/FitScoreBadge.tsx

'use client';

import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface FitScoreBadgeProps {
  score: number;
  breakdown?: FitScoreBreakdown;
  size?: 'sm' | 'md' | 'lg';
}

export function FitScoreBadge({ score, breakdown, size = 'md' }: FitScoreBadgeProps) {
  const color =
    score >= 80 ? 'bg-green-100 text-green-800 border-green-200' :
    score >= 50 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
    'bg-red-100 text-red-800 border-red-200';

  const badge = (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-semibold',
        color,
        size === 'sm' ? 'px-2 py-0.5 text-xs' :
        size === 'lg' ? 'px-3 py-1 text-sm' :
        'px-2.5 py-0.5 text-xs',
      )}
    >
      {score}% fit
    </span>
  );

  if (!breakdown) return badge;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent side="bottom" className="w-64 p-3">
        <div className="space-y-2 text-xs">
          <p className="font-medium">{breakdown.summary}</p>
          {breakdown.matchedSkills.length > 0 && (
            <div>
              <p className="text-green-600 font-medium">✅ Match</p>
              <p>{breakdown.matchedSkills.join(', ')}</p>
            </div>
          )}
          {breakdown.skillGaps.length > 0 && (
            <div>
              <p className="text-red-600 font-medium">❌ Gaps</p>
              <p>{breakdown.skillGaps.join(', ')}</p>
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
```

### 8.2 — Cover Letter Generation with Streaming

```typescript
// src/components/jobs/CoverLetterPanel.tsx
// Uses readStreamableValue from ai/rsc or a custom stream reader

'use client';

import { useState, useRef } from 'react';
import { api } from '@/trpc/react';
import { AIStreamingText } from '@/components/shared/AIStreamingText';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Tone = 'professional' | 'conversational' | 'formal' | 'startup-friendly';
type Length = 'brief' | 'standard' | 'detailed';

export function CoverLetterPanel({ jobPostId, profileId }: {
  jobPostId: string;
  profileId: string;
}) {
  const [tone, setTone] = useState<Tone>('professional');
  const [length, setLength] = useState<Length>('standard');
  const [stream, setStream] = useState<ReadableStream<string> | null>(null);
  const [editableText, setEditableText] = useState('');
  const [isGenerated, setIsGenerated] = useState(false);

  const generate = api.jobs.generateCoverLetter.useMutation({
    onSuccess: (textStream) => {
      setStream(textStream);
      setIsGenerated(true);
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Select value={tone} onValueChange={(v) => setTone(v as Tone)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="professional">Professional</SelectItem>
            <SelectItem value="conversational">Conversational</SelectItem>
            <SelectItem value="formal">Formal</SelectItem>
            <SelectItem value="startup-friendly">Startup-Friendly</SelectItem>
          </SelectContent>
        </Select>

        <Select value={length} onValueChange={(v) => setLength(v as Length)}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="brief">Brief</SelectItem>
            <SelectItem value="standard">Standard</SelectItem>
            <SelectItem value="detailed">Detailed</SelectItem>
          </SelectContent>
        </Select>

        <button
          onClick={() => generate.mutate({ jobPostId, profileId, tone, length })}
          disabled={generate.isPending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {generate.isPending ? 'Generating...' : isGenerated ? 'Regenerate' : 'Generate'}
        </button>
      </div>

      {stream && !isGenerated && (
        <AIStreamingText stream={stream} className="rounded-md border border-border p-4 text-sm" />
      )}

      {isGenerated && (
        <textarea
          value={editableText}
          onChange={(e) => setEditableText(e.target.value)}
          className="min-h-64 w-full rounded-md border border-border p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      )}
    </div>
  );
}
```

---

## 9. Kanban Board

### 9.1 — dnd-kit Setup

```typescript
// src/components/jobs/KanbanBoard.tsx

'use client';

import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { api } from '@/trpc/react';
import { useKanbanStore } from '@/stores/kanban-store';

export function KanbanBoard() {
  const { columns, moveCard, setDraggedCard, draggedCard } = useKanbanStore();
  const updateStatus = api.jobs.updateApplicationStatus.useMutation();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }, // prevent accidental drags
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    setDraggedCard(active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setDraggedCard(null);

    if (!over) return;

    const applicationId = active.id as string;
    const newStatus = over.data.current?.status as KanbanStatus;
    const newPosition = over.data.current?.position as number;

    if (!newStatus) return;

    // Optimistic update
    moveCard(applicationId, newStatus, newPosition ?? 0);

    // Server sync
    updateStatus.mutate({
      applicationId,
      status: newStatus,
      columnPosition: newPosition ?? 0,
    });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full gap-3 overflow-x-auto pb-4">
        {columns.map((column) => (
          <KanbanColumn key={column.status} column={column} />
        ))}
      </div>

      <DragOverlay>
        {draggedCard && <ApplicationCardOverlay applicationId={draggedCard} />}
      </DragOverlay>
    </DndContext>
  );
}
```

### 9.2 — Zustand Kanban Store

```typescript
// src/stores/kanban-store.ts

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface KanbanStore {
  columns: KanbanColumn[];
  draggedCard: string | null;

  setColumns: (columns: KanbanColumn[]) => void;
  moveCard: (applicationId: string, newStatus: KanbanStatus, position: number) => void;
  setDraggedCard: (id: string | null) => void;
  updateFollowUp: (applicationId: string, date: Date | null) => void;
}

export const useKanbanStore = create<KanbanStore>()(
  immer((set) => ({
    columns: [],
    draggedCard: null,

    setColumns: (columns) => set((state) => { state.columns = columns; }),

    moveCard: (applicationId, newStatus, position) => set((state) => {
      // Find and remove from current column
      let card: JobApplicationCard | undefined;
      for (const col of state.columns) {
        const idx = col.applications.findIndex((a) => a.id === applicationId);
        if (idx !== -1) {
          [card] = col.applications.splice(idx, 1);
          break;
        }
      }

      if (!card) return;

      // Insert into new column at position
      const targetCol = state.columns.find((c) => c.status === newStatus);
      if (targetCol) {
        card.status = newStatus;
        targetCol.applications.splice(position, 0, card);
      }
    }),

    setDraggedCard: (id) => set((state) => { state.draggedCard = id; }),

    updateFollowUp: (applicationId, date) => set((state) => {
      for (const col of state.columns) {
        const app = col.applications.find((a) => a.id === applicationId);
        if (app) {
          app.nextFollowUp = date;
          app.isFollowUpOverdue = date ? date < new Date() : false;
          break;
        }
      }
    }),
  }))
);
```

---

## 10. Job Card Component

```typescript
// src/components/jobs/JobCard.tsx

'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { MapPin, Briefcase, Clock, DollarSign, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FitScoreBadge } from './FitScoreBadge';
import { SOURCE_META } from '@/lib/jobs/constants';

interface JobCardProps {
  job: JobPostPreview;
  isSelected?: boolean;
  onSelect: (id: string) => void;
  onSave: (id: string) => void;
  variant?: 'feed' | 'saved' | 'kanban';
}

const SOURCE_COLORS: Record<JobSource, string> = {
  LINKEDIN:  'bg-blue-100 text-blue-800',
  INDEED:    'bg-purple-100 text-purple-800',
  GLASSDOOR: 'bg-green-100 text-green-800',
  GUPY:      'bg-orange-100 text-orange-800',
  MANUAL:    'bg-gray-100 text-gray-800',
};

export function JobCard({ job, isSelected, onSelect, onSave, variant = 'feed' }: JobCardProps) {
  const salaryText = job.salaryMin
    ? `R$ ${(job.salaryMin / 1000).toFixed(0)}k${job.salaryMax ? `–${(job.salaryMax / 1000).toFixed(0)}k` : '+'}`
    : null;

  return (
    <motion.div
      layout
      onClick={() => onSelect(job.id)}
      className={cn(
        'cursor-pointer rounded-lg border bg-card p-4 transition-all',
        isSelected ? 'border-primary shadow-sm ring-1 ring-primary' : 'border-border hover:border-primary/50 hover:shadow-sm',
      )}
      whileHover={{ y: variant === 'feed' ? -1 : 0 }}
      transition={{ duration: 0.15 }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          {/* Company Logo */}
          <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md border border-border bg-muted">
            {job.companyLogo ? (
              <Image src={job.companyLogo} alt={job.company} fill className="object-contain p-1" />
            ) : (
              <div className="flex h-full items-center justify-center text-xl">
                {job.company.charAt(0)}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground line-clamp-1">{job.title}</h3>
            <p className="text-xs text-muted-foreground">{job.company}</p>
          </div>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onSave(job.id); }}
          className={cn(
            'flex-shrink-0 rounded-full p-1.5 transition-colors',
            job.isSaved ? 'text-primary' : 'text-muted-foreground hover:text-primary'
          )}
          aria-label={job.isSaved ? 'Unsave job' : 'Save job'}
        >
          <Bookmark className={cn('h-4 w-4', job.isSaved && 'fill-current')} />
        </button>
      </div>

      {/* Meta row */}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {job.location && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {job.location}
          </span>
        )}
        {(job.remote || job.hybrid) && (
          <span className={cn(
            'rounded-full px-1.5 py-0.5 text-xs font-medium',
            job.remote ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
          )}>
            {job.remote ? 'Remote' : 'Hybrid'}
          </span>
        )}
        {salaryText && (
          <span className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            {salaryText}
          </span>
        )}
        {job.postedAt && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatRelativeDate(job.postedAt)}
          </span>
        )}
      </div>

      {/* Skills chips */}
      {job.skills.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {job.skills.slice(0, 4).map((skill) => (
            <span
              key={skill}
              className="rounded-md bg-secondary px-1.5 py-0.5 text-xs font-medium text-secondary-foreground"
            >
              {skill}
            </span>
          ))}
          {job.skills.length > 4 && (
            <span className="text-xs text-muted-foreground">+{job.skills.length - 4}</span>
          )}
        </div>
      )}

      {/* Footer: source + fit score */}
      <div className="mt-2 flex items-center justify-between">
        <span className={cn(
          'rounded-full px-1.5 py-0.5 text-xs font-medium',
          SOURCE_COLORS[job.source]
        )}>
          {job.source.charAt(0) + job.source.slice(1).toLowerCase()}
        </span>

        {job.fitScore != null && (
          <FitScoreBadge score={job.fitScore} size="sm" />
        )}
      </div>
    </motion.div>
  );
}
```

---

## 11. Filters

### Filter Panel State

```typescript
// src/stores/job-filter-store.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface JobFilterStore {
  filters: JobFilters;
  setFilter: <K extends keyof JobFilters>(key: K, value: JobFilters[K]) => void;
  resetFilters: () => void;
  activeFilterCount: number;
}

interface JobFilters {
  query: string;
  skills: string[];
  remote: boolean | null;
  hybrid: boolean | null;
  salaryMin: number | null;
  salaryMax: number | null;
  sources: JobSource[];
  datePosted: 'today' | 'week' | 'month' | 'any';
  companySize: string[];
  jobTypes: string[];
}

const DEFAULT_FILTERS: JobFilters = {
  query: '',
  skills: [],
  remote: null,
  hybrid: null,
  salaryMin: null,
  salaryMax: null,
  sources: ['LINKEDIN', 'INDEED', 'GLASSDOOR', 'GUPY'],
  datePosted: 'any',
  companySize: [],
  jobTypes: [],
};

export const useJobFilterStore = create<JobFilterStore>()(
  persist(
    (set, get) => ({
      filters: DEFAULT_FILTERS,
      setFilter: (key, value) => set((state) => ({
        filters: { ...state.filters, [key]: value },
      })),
      resetFilters: () => set({ filters: DEFAULT_FILTERS }),
      get activeFilterCount() {
        const f = get().filters;
        return (
          (f.skills.length > 0 ? 1 : 0) +
          (f.remote !== null ? 1 : 0) +
          (f.salaryMin !== null ? 1 : 0) +
          (f.datePosted !== 'any' ? 1 : 0) +
          (f.companySize.length > 0 ? 1 : 0)
        );
      },
    }),
    { name: 'job-filters' }
  )
);
```

### Salary Range Slider

```typescript
// src/components/jobs/SalarySlider.tsx
// Uses Radix UI Slider with BRL formatting

// Props: min=0, max=50000, step=1000
// Displays: "R$ 8.000 – R$ 25.000"
// BRL format: Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
```

---

## 12. Notifications

### Notification Schema (extends main Notification model)

```typescript
// Notifications are stored in a shared Notification model in the main schema
// Job-specific notification payloads:

interface NewJobsNotificationPayload {
  type: 'new_jobs';
  profileName: string;
  profileId: string;
  newJobCount: number;
  topMatch: {
    title: string;
    company: string;
    fitScore?: number;
  };
}

interface FollowUpReminderPayload {
  type: 'follow_up_reminder';
  applicationId: string;
  company: string;
  jobTitle: string;
  followUpDate: string;
}
```

### Alert Dispatch

```typescript
// src/lib/jobs/notifications.ts

export async function sendJobAlert(
  userId: string,
  count: number,
  profileName: string
): Promise<void> {
  // Find the top matching job (highest fit score if profile has skills)
  const topMatch = await prisma.jobPost.findFirst({
    where: { isActive: true, scrapedAt: { gte: new Date(Date.now() - 2 * 60 * 60 * 1000) } },
    orderBy: { scrapedAt: 'desc' },
  });

  await prisma.notification.create({
    data: {
      userId,
      type: 'new_jobs',
      title: `${count} new job${count !== 1 ? 's' : ''} match "${profileName}"`,
      body: topMatch ? `Top match: ${topMatch.title} at ${topMatch.company}` : undefined,
      payload: JSON.stringify({
        type: 'new_jobs',
        profileName,
        newJobCount: count,
        topMatch: topMatch ? { title: topMatch.title, company: topMatch.company } : null,
      } satisfies NewJobsNotificationPayload),
      isRead: false,
    },
  });
}
```

---

## 13. Testing

### 13.1 — Scraper Mock Tests

```typescript
// src/lib/scrapers/job-scraper/__tests__/linkedin-scraper.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LinkedInJobScraper } from '../linkedin-scraper';

const mockPageEvaluate = vi.fn().mockResolvedValue([
  {
    title: 'Senior Frontend Developer',
    company: 'Nubank',
    location: 'São Paulo - Remote',
    sourceUrl: 'https://linkedin.com/jobs/view/123',
    postedAtText: '2024-01-15',
    companyLogo: 'https://cdn.example.com/nubank.png',
  },
]);

vi.mock('playwright', () => ({
  chromium: {
    launch: vi.fn().mockResolvedValue({
      newPage: vi.fn().mockResolvedValue({
        setExtraHTTPHeaders: vi.fn(),
        goto: vi.fn(),
        waitForSelector: vi.fn(),
        evaluate: mockPageEvaluate,
        close: vi.fn(),
      }),
      close: vi.fn(),
    }),
  },
}));

describe('LinkedInJobScraper', () => {
  let scraper: LinkedInJobScraper;

  beforeEach(async () => {
    scraper = new LinkedInJobScraper();
    await scraper.init();
  });

  it('returns scraped job previews', async () => {
    const results = await scraper.search('frontend developer', { remote: true });
    expect(results).toHaveLength(1);
    expect(results[0]!.title).toBe('Senior Frontend Developer');
    expect(results[0]!.company).toBe('Nubank');
  });

  it('correctly detects remote from location string', async () => {
    const results = await scraper.search('frontend', {});
    expect(results[0]!.remote).toBe(true);
  });

  it('enforces 5s rate limiting between requests', async () => {
    const start = Date.now();
    await Promise.all([
      scraper.search('react', {}),
      scraper.search('vue', {}),
    ]);
    expect(Date.now() - start).toBeGreaterThan(4900);
  });
});
```

### 13.2 — Kanban Drag-Drop E2E Tests (Playwright)

```typescript
// e2e/jobs/kanban.spec.ts

import { test, expect, Page } from '@playwright/test';

test.describe('Job Application Kanban', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/jobs/tracker');
    await page.waitForSelector('[data-testid="kanban-board"]');
  });

  test('drag application card from Wishlist to Applied', async ({ page }) => {
    const sourceCard = page
      .locator('[data-testid="kanban-column-WISHLIST"]')
      .locator('[data-testid="application-card"]')
      .first();

    const targetColumn = page.locator('[data-testid="kanban-column-APPLIED"]');

    // Use playwright drag
    await sourceCard.dragTo(targetColumn);

    // Verify card moved
    await expect(targetColumn).toContainText(await sourceCard.textContent() ?? '');
    await expect(
      page.locator('[data-testid="kanban-column-WISHLIST"]')
    ).not.toContainText(await sourceCard.textContent() ?? '');
  });

  test('overdue follow-up shows red highlight', async ({ page }) => {
    // Card with a past follow-up date should have red indicator
    const overdueCard = page.locator('[data-testid="application-card"][data-overdue="true"]').first();
    await expect(overdueCard.locator('[data-testid="follow-up-badge"]')).toHaveClass(/text-red/);
  });

  test('keyboard drag-drop is accessible', async ({ page }) => {
    const card = page
      .locator('[data-testid="kanban-column-WISHLIST"] [data-testid="application-card"]')
      .first();

    await card.focus();
    await page.keyboard.press('Space');                  // pick up
    await page.keyboard.press('ArrowRight');             // move to next column
    await page.keyboard.press('Space');                  // drop

    // Application should now be in Applied column
    const appliedColumn = page.locator('[data-testid="kanban-column-APPLIED"]');
    await expect(appliedColumn.locator('[data-testid="application-card"]')).toHaveCount(
      (await appliedColumn.locator('[data-testid="application-card"]').count()) // ≥ 1
    );
  });

  test('moving to Applied column prompts for applied date', async ({ page }) => {
    const card = page
      .locator('[data-testid="kanban-column-WISHLIST"] [data-testid="application-card"]')
      .first();

    const targetColumn = page.locator('[data-testid="kanban-column-APPLIED"]');
    await card.dragTo(targetColumn);

    await expect(page.locator('[data-testid="applied-date-modal"]')).toBeVisible();
    await page.locator('[data-testid="applied-date-modal"] [data-testid="confirm-today"]').click();
    await expect(page.locator('[data-testid="applied-date-modal"]')).not.toBeVisible();
  });
});
```

### 13.3 — AI Mock Tests

```typescript
// src/server/routers/__tests__/jobs-ai.test.ts

import { describe, it, expect, vi } from 'vitest';
import { createCaller } from '../jobs';

vi.mock('ai', () => ({
  generateObject: vi.fn().mockResolvedValue({
    object: {
      score: 87,
      matchedSkills: ['React', 'TypeScript', 'Next.js'],
      skillGaps: ['AWS'],
      niceToHaveMatches: ['GraphQL'],
      recommendation: 'apply',
      summary: 'Strong match — only AWS is a gap, which is listed as preferred not required.',
    },
  }),
  streamText: vi.fn().mockReturnValue({
    textStream: new ReadableStream({
      start(controller) {
        controller.enqueue('Dear Hiring Manager,\n\n');
        controller.enqueue('I am writing to express my interest...');
        controller.close();
      },
    }),
  }),
}));

describe('getAIFitScore', () => {
  it('returns score and breakdown', async () => {
    const caller = createCaller(createMockContext());
    const result = await caller.getAIFitScore({
      jobPostId: 'job-1',
      profileId: 'profile-1',
    });

    expect(result.score).toBe(87);
    expect(result.matchedSkills).toContain('React');
    expect(result.skillGaps).toContain('AWS');
    expect(result.recommendation).toBe('apply');
  });
});

describe('generateCoverLetter', () => {
  it('returns a streaming text response', async () => {
    const caller = createCaller(createMockContext());
    const stream = await caller.generateCoverLetter({
      jobPostId: 'job-1',
      profileId: 'profile-1',
      tone: 'professional',
      length: 'standard',
    });

    expect(stream).toBeInstanceOf(ReadableStream);

    const reader = stream.getReader();
    const { value } = await reader.read();
    expect(typeof value).toBe('string');
    expect(value).toContain('Dear');
  });
});

describe('generateInterviewPrep', () => {
  it('returns categorized interview questions', async () => {
    vi.mocked(generateObject).mockResolvedValueOnce({
      object: {
        behavioral: [{ question: 'Tell me about a challenging project', hint: 'Use STAR', framework: 'STAR' }],
        technical: [{ question: 'Explain React reconciliation', hint: 'Focus on Fiber', difficulty: 'senior' }],
        cultureFit: [{ question: 'How do you handle feedback?', hint: 'Be specific' }],
        roleSpecific: [{ question: 'How would you improve our checkout flow?', hint: 'Ask clarifying questions first' }],
      },
    });

    const caller = createCaller(createMockContext());
    const result = await caller.generateInterviewPrep({ applicationId: 'app-1' });

    expect(result.behavioral).toHaveLength(1);
    expect(result.technical[0]!.difficulty).toBe('senior');
    expect(result.cultureFit).toHaveLength(1);
  });
});
```

### 13.4 — Fit Score Persistence Test

```typescript
// src/server/routers/__tests__/jobs-fit-score.test.ts

it('persists fit score to SavedJob after computation', async () => {
  const caller = createCaller(createMockContext({ userId: 'user-1' }));

  // First call computes and saves
  const result = await caller.getAIFitScore({ jobPostId: 'job-1', profileId: 'profile-1' });
  expect(result.score).toBe(87);

  const savedJob = await prisma.savedJob.findUnique({
    where: { userId_jobPostId: { userId: 'user-1', jobPostId: 'job-1' } },
  });

  expect(savedJob?.fitScore).toBe(87);
});
```

---

## Appendix: File Structure

```
src/
├── app/(dashboard)/jobs/
│   ├── page.tsx                           # Job Feed (RSC)
│   ├── saved/
│   │   └── page.tsx                       # Saved Jobs grid (RSC)
│   ├── tracker/
│   │   └── page.tsx                       # Kanban Board (RSC shell)
│   └── _components/
│       ├── JobFeedLayout.tsx              # 3-column layout container
│       ├── JobFiltersSidebar.tsx
│       ├── JobList.tsx                    # Infinite scroll list
│       ├── JobCard.tsx
│       ├── JobDetailPanel.tsx             # Right panel with full JD
│       ├── FitScoreBadge.tsx
│       ├── FitScoreBreakdown.tsx
│       ├── CoverLetterPanel.tsx
│       ├── InterviewPrepPanel.tsx
│       ├── CompanyResearchPanel.tsx
│       ├── KanbanBoard.tsx
│       ├── KanbanColumn.tsx
│       ├── ApplicationCard.tsx
│       ├── ApplicationCardOverlay.tsx     # DragOverlay version
│       ├── FollowUpModal.tsx
│       ├── AppliedDateModal.tsx
│       └── SearchProfileForm.tsx
├── server/routers/jobs.ts
├── lib/
│   ├── scrapers/job-scraper/
│   │   ├── base-job-scraper.ts
│   │   ├── linkedin-scraper.ts
│   │   ├── indeed-scraper.ts
│   │   ├── glassdoor-scraper.ts
│   │   ├── gupy-scraper.ts
│   │   └── job-cache.ts
│   └── jobs/
│       ├── notifications.ts
│       └── constants.ts
├── stores/
│   ├── kanban-store.ts
│   └── job-filter-store.ts
└── app/api/cron/
    └── refresh-jobs/
        └── route.ts
```

### vercel.json (cron configuration)

```json
{
  "crons": [
    {
      "path": "/api/cron/refresh-jobs",
      "schedule": "0 */2 * * *"
    }
  ]
}
```
