<!-- GitHub Copilot / AI agent instructions for UniDash -->
# UniDash — Copilot Instructions

Purpose: quick, actionable guidance so an AI coding agent can be immediately productive in this repo.

- **Big picture:** UniDash is a React + TypeScript single-page app (Vite) that uses Firebase for auth and Firestore as the primary datastore. Routing is mounted inside `AuthProvider` with `HashRouter` ([src/App.tsx](src/App.tsx)). UI pages live in `src/pages`, reusable UI in `src/components`, and business logic lives in `src/services`.

- **Key integration points:**
  - Authentication: `src/contexts/AuthContext.tsx` reads Firebase auth and user profile documents from Firestore. Use `useAuth()` for auth state and `isAdmin` checks.
  - Database operations: `src/services/database.service.ts` contains the Firestore queries and transactional logic (counters, sequence allocation). These functions often log Firestore paths and data for debugging.
  - AI features: `src/services/ai.service.ts` calls Gemini via `VITE_GEMINI_API_KEY` in `.env.local`. See `docs/AI_SETUP.md` for usage patterns and limits.

- **Project-specific conventions & patterns:**
  - Environment: runtime secrets live in `.env.local` and exposed to the client via `VITE_` prefixed vars. Example: `VITE_FIREBASE_*`, `VITE_GEMINI_API_KEY`.
  - Router & protection: top-level routes use `ProtectedRoute` and `AdminRoute` wrappers ([src/App.tsx](src/App.tsx), [src/components/ProtectedRoute.tsx](src/components/ProtectedRoute.tsx)). Follow these patterns when adding pages.
  - Sequence counters: persistent sequence numbers (chapters, TD/TP numbers, course codes) are implemented with a `counters` collection + transactions in `database.service.ts`. Prefer `runTransaction` when altering counters.
  - Firestore rules are authoritative: the app relies on `firestore.rules` and role documents in `users` collection; verify behavior against rules before changing security-sensitive code.
  - Console-first debugging: many service functions log actionable messages (e.g., `getCourseById` logs path/data). Use these logs to trace Firestore reads/writes.

- **Developer workflows / commands:**
  - Install: `npm install`
  - Run dev server: `npm run dev` (Vite, default on port in README)
  - Add env: create `.env.local` with `VITE_FIREBASE_*` and `VITE_GEMINI_API_KEY` (see `README.md` and `docs/AI_SETUP.md`).
  - Deploy Firestore rules: `firebase deploy --only firestore:rules` (the repo contains `firestore.rules`).

- **Where to look for common tasks / examples:**
  - Auth & user roles: [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx) and `users` Firestore collection.
  - Service patterns (CRUD, transactions): [src/services/database.service.ts](src/services/database.service.ts).
  - AI generation flow & error messages: [src/services/ai.service.ts](src/services/ai.service.ts) and [docs/AI_SETUP.md](docs/AI_SETUP.md).
  - Routing & page structure: [src/App.tsx](src/App.tsx) and `src/pages/*`.

- **Safety notes and quick checks before editing:**
  - Changing data shape: update Firestore rules, types in `src/types/types.ts` (or `src/types`) and ensure the UI forms match new fields.
  - Changing counters or transactional logic: write local tests or use a staging Firebase project — transactions affect production counters.
  - AI key errors: `ai.service.ts` throws explicit errors if `VITE_GEMINI_API_KEY` is missing; ensure env var is set and server restarted.

- **Small examples to follow:**
  - Add new protected page: create page in `src/pages`, add a route inside the protected `<Route path="/" ...>` in [src/App.tsx](src/App.tsx), wrap admin pages with `AdminRoute`.
  - Add series with sequence number: mirror `createSeries` in [src/services/database.service.ts](src/services/database.service.ts) — use `counters` + `runTransaction`.

- **When opening PRs:**
  - Mention affected Firebase rules or env vars in the PR description.
  - If touching security or counters, include a short migration/testing plan.

If anything here is unclear or missing (specific files, environment values, or local test instructions), tell me which area to expand and I'll iterate.
