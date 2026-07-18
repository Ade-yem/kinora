# Workout AI

Workout AI is a next-generation, AI-driven Personal Trainer application designed as a Progressive Web Application (PWA). It features a **dual-panel interface** combining a real-time conversational chat pane with a dynamic **Live Routine Preview Component** that visualizes workouts as structured interactive UI.

The platform leverages a custom multi-agent **Actor-Critic (Generator-Reviewer) loop** powered by **DeepSeek-V4-Flash** to create, validate, refine, and persist multi-day training programs tailored to user constraints (e.g., equipment limits, location, available session duration, and injury safety gateways).

---

## 🚀 Key Features

* **Real-time Conversational Intake**: Streams agent thoughts and final responses via Server-Sent Events (SSE) to display multi-agent reasoning steps before updating the routine view.
* **Dual-Panel Workspace View**: Uses a split viewport (desktop side-by-side flex layout) and a swipeable bottom overlay sheet (for mobile viewports) to balance chat and active routine preview.
* **Live Routine Preview Component**: Formats workout splits as interactive tabular cards. Any changes suggested in chat are patched directly into the Preview's data model, and manual edits on the preview are synchronized back to the agent's context.
* **Actor-Critic (Generator-Reviewer) Multi-Agent Loop**:
  - **Generator Agent (Actor)**: Interprets user prompts, queries the exercise catalog (approx. 3,000 movements) using function-calling tools (`GetExercisesByParameters`), and proposes candidate JSON structures.
  - **Reviewer Agent (Critic)**: Validates safety (injury check), duration/volume compliance, and logistical viability. If rejected, it feeds critic feedback notes back to the Generator for up to 3 refinement iterations.
* **Multi-Day Split Persistance**: Atomic database transactions that save entire workout splits simultaneously under a shared `programId`, automatically cleaning up obsolete/pruned day indexes.
* **Progressive Web App (PWA) Systems**:
  - Offline sync using browser **IndexedDB** powered by **Dexie.js**.
  - Wake-lock orchestration via **HTML5 Screen Wake Lock API** (`navigator.wakeLock`) to keep screens active during active tracking.
  - Custom Service Workers implementing asset caching strategies.
* **Safety Gateways**: Initial prompt scanning filters out medical emergencies and trauma, while strict Critic validation rejects unsafe configurations (e.g., overhead movements during shoulder injury notes).
* **Workout Logging & Stats**: Tracks workout completion, volume, streaks, and personal records.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router), React 19 (Strict Mode), TypeScript
- **Styling**: Tailwind CSS v4 (configured via theme tokens inside `app/globals.css`, no `tailwind.config.js`)
- **State Management**: **Zustand** (split into modules under `lib/store/*Slice.ts`, combined at `lib/store/index.ts`)
- **Offline Cache**: Dexie.js (IndexedDB wrapper) & Custom Service Worker (`public/sw.js`)

### Backend
- **Database ORM**: Prisma 7 (Custom output path: `@/app/generated/prisma/client`)
- **Database**: PostgreSQL (connected via `@prisma/adapter-pg` driver adapter)
- **Authentication**: NextAuth.js v4 (supporting Email/Password Credentials & declared OAuth providers)
- **LLM Pipeline**: OpenAI SDK interfacing with DeepSeek OpenAI-compatible endpoint
- **Input Validation**: Zod boundary schemas (`lib/validation/*.ts`)

---

## 📁 Directory Structure

```bash
├── app/
│   ├── api/                 # Stateless API endpoints (auth, chat, routines, profile, stats)
│   ├── generated/prisma/    # Custom generated Prisma client output
│   ├── (auth)/              # Authentication screens (login, register)
│   ├── chat/                # Split-pane conversational assistant workspace
│   ├── feedback/            # Post-workout feedback loops
│   ├── home/                # Active dashboard, workout selection cards
│   ├── onboarding/          # Profile setup and goal definition wizard
│   ├── profile/             # User settings, injuries, equipment selectors
│   ├── workout/             # Active workout trackers, timers, and wake locks
│   └── globals.css          # Core CSS stylesheet housing Tailwind v4 directives
├── components/              # Shared component library (ui, onboarding, chat, workout, etc.)
├── Ideas/                   # Specification docs, data structures, and architectural reviews
├── lib/
│   ├── api/                 # Data transformers, normalization, and mappers
│   ├── chat/                # Generator and Reviewer prompts, tools, and the Actor-Critic loop
│   ├── store/               # Zustand state slices (chat, onboarding, routines, stats, etc.)
│   ├── auth.ts              # NextAuth configurations
│   ├── db.ts                # Hot-reload-safe Prisma client singleton
│   └── llm.ts               # LLM client configuration
├── prisma/
│   ├── schema.prisma        # Database entity definitions (User, Profile, WorkoutRoutine, etc.)
│   └── migrations/          # SQL database migration history
└── scripts/                 # CLI utilities (e.g., spreadsheet parse-and-seed scripts)
```

---

## ⚙️ Getting Started & Local Setup

This project uses **pnpm** as its package manager. Ensure you have Node.js 20+ and pnpm installed.

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/<db_name>?schema=public"
NEXTAUTH_SECRET="your_nextauth_jwt_secret"
NEXTAUTH_URL="http://localhost:3000"

DEEPSEEK_API_KEY="your_deepseek_api_key"
DEEPSEEK_MODEL="deepseek-v4-flash"
```

### 3. Initialize the Database
Generate the custom Prisma Client and apply migrations:
```bash
pnpm generate
pnpm migrate
```

### 4. Seed Exercise Catalog
Seed the master exercise catalog from the pre-populated JSON dataset:
```bash
pnpm run seed-exercises
# Or run your custom database seeder scripts inside `scripts/`
```

### 5. Run the Application
Start the Next.js development server:
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 📌 Standing Conventions

To maintain a clean and highly structured code pattern, all contributors must adhere to:

1. **600-line File Cap**: No component, page, or module file should exceed ~600 lines of code. Split complex UI elements into standalone subcomponents.
2. **Zustand-Centralized Server State**: Any server-fetched data should live in a Zustand store slice with associated async actions. Avoid local page `useState` hooks for server state.
3. **No Explicit `any` in Types**: Strictly specify TypeScript interfaces and type parameters for all functions, variables, and API responses.
4. **Custom Prisma Import**: Always import the Prisma client from `@/app/generated/prisma/client`, never from the standard `@prisma/client` package.
