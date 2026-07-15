# System Architecture & Technical Specification Document

## 1. Architectural Overview

The system is engineered as a decoupled, multi-agent single-page Progressive Web Application (PWA). It relies on a stateful client interface interacting with stateless, asynchronous edge/serverless runtimes via REST endpoints.

The application uses an **Actor-Critic (Generator-Reviewer) multi-agent loop** to dynamically build, validate, and alter training plans drawn from a database of nearly 3,000 exercises.

---

## 2. Frontend Architecture & Client-Side Design

The frontend is constructed using **Next.js (App Router)** as an installable PWA. The primary design goal is ensuring smooth layout changes alongside a real-time conversational interface.

### A. View Layer Layout & State Sync Mechanics

* **Dual-Panel Client Workspace:** The core chat view operates on a split viewport model (`/app/chat/page.tsx`). On desktop viewports, it utilizes a side-by-side flex layout; on mobile viewports, it transitions to a swipeable bottom overlay sheet component.
* **The Shared Local Core State:** Client-side state management is handled via **Zustand**. This state layer maintains the active chat logs, the active candidate workout blueprint, and the operational application view state (`CHAT_FOCUS`, `PREVIEW_OVERLAY`, `ACTIVE_WORKOUT_TRACKING`).
* **Bi-directional Event Streaming:** The chat client communicates with the API handler using standard JSON POST requests, but it receives responses via **Server-Sent Events (SSE)**. This allows the user to see the reasoning steps of both the Generator and Reviewer agents in real time before the final routine populates the preview pane.

### B. Progressive Web App (PWA) Systems

* **Local Data Hydration:** Active routines and real-time training performance values are saved straight into the browser’s **IndexedDB** using **Dexie.js**. This ensures the app remains stable during temporary network drops.
* **Screen Continuous Active Control:** During active exercise tracking mode, the UI hooks into the native **HTML5 Screen Wake Lock API** (`navigator.wakeLock`). This keeps the smartphone screen turned on while timers or sets are actively running.
* **Service Worker Cache Management:** A custom Service Worker (`sw.js`) intercepts network requests to serve assets, core layout sheets, and local fonts directly from the cache. It switches to a network-first strategy for database queries.

---

## 3. Backend Architecture & Multi-Agent Engine

The backend layer acts as an event-driven orchestration wrapper around **DeepSeek-V4-Flash** models, accessed using the standard OpenAI SDK client parameters.

### A. The Actor-Critic (Generator-Reviewer) Execution Loop

Instead of relying on a single inference call, the orchestration endpoint runs an internal pipeline that matches routines against user parameters:

1. **Intake Phase:** The incoming route handler fetches the current user's profile metadata, targeting history, and tagged medical constraints (e.g., lower back structural limits) from the database.
2. **Generation Phase (Actor):** The Generator agent processes the user's chat text. It accesses the exercise database via custom **Function Calling tools** to filter, choose, and arrange exercises based on the user's specific goals.
3. **Review Phase (Critic):** The resulting JSON configuration is handed over to the independent Reviewer agent. This agent evaluates the routine against strict kinesiological rules and the user's health history.
4. **Loop Resolution:** * *If Rejected:* The Reviewer outputs structured validation notes explaining the issue. The loop restarts, feeding those error flags back into the Generator.
* *If Approved:* The routine's status changes to `APPROVED`, the compilation ends, and the final routine is written to the database.



### B. Agent Tooling System (Function Calling)

The Generator and Reviewer agents are restricted from raw database access. They interact with the database through deterministic tools exposed by the Next.js API layer:

* `GetExercisesByParameters`: Accepts query criteria (muscles, mechanics, available equipment) and returns matching arrays from the database.
* `RetrieveUserSafetyProfile`: Pulls injury variables and physical limitations for the Reviewer agent to double-check against candidate workouts.

---

## 4. Data Layer & Schema Architecture

The relational schema is built with **Prisma** to manage high-throughput operations across distinct entities:

```
┌──────────────┐         ┌───────────────────┐         ┌───────────────┐
│     User     ├───1:1──►│    UserProfile    │         │   Exercise    │
└──────┬───────┘         └───────────────────┘         └───────┬───────┘
       │                                                       │
      1:N                                                     1:N
       │                                                       │
       ▼                                                       ▼
┌──────────────┐         ┌───────────────────┐         ┌───────────────┐
│ ChatSession  ├───1:N──►│  WorkoutRoutine   ├───1:N──►│  RoutineItem  │
└──────┬───────┘         └─────────┬─────────┘         └───────────────┘
       │                           │
      1:N                         1:N
       │                           │
       ▼                           ▼
┌──────────────┐         ┌───────────────────┐
│ ChatMessage  │         │    WorkoutLog     │
└──────────────┘         └───────────────────┘

```

### Core Entity Definitions

* **Exercise Master Inventory:** Holds your dataset of nearly 3,000 movements. Every entry features categorical indexes: Primary Muscle, Secondary Muscle Array, Equipment Constraints (`DUMBBELL`, `BODYWEIGHT`), Movement Type (`COMPOUND`, `ISOLATION`), and Mechanic Type (`PUSH`, `PULL`).
* **WorkoutRoutine & RoutineItem:** Tracks the active state of generated splits (`PENDING_GENERATION`, `PENDING_REVIEW`, `REJECTED`, `APPROVED`). The items use sequential indices (`order`) to maintain the precise exercise structure designed by the agent.
* **Performance Tracking Metrics:** Stores completed training logs as a compressed JSON matrix, archiving historical workloads, set performance, completed repetitions, and actual RPE scores.

---

## 5. Security, Infrastructure, & Safety Gateways

### A. Edge Infrastructure & Compute

* **Runtimes:** The user chat endpoint and layout delivery routes run on standard Node.js environments to prevent timeout limitations during multi-agent validation cycles.
* **Caching Strategy:** Static exercise details and instructional parameters are cached at the edge CDN layer to minimize direct database queries during routine hydration.

### B. Safety & Input Guardrails

* **Systemic Input Sanitization:** User prompts are passed through an initial content filtering function before entering the agent network. Any input mentioning severe medical emergencies or acute trauma is immediately bypassed, halting the agent loop and prompting the user to consult a healthcare professional.
* **Agent Constraint Enforcement:** The system prompt for the Reviewer agent functions as an absolute programmatic boundary. The backend application will not save or render any workout routine unless it receives a verifiable, explicit `"status": "APPROVED"` flag from the Critic model.