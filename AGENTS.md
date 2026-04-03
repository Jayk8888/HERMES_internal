# AGENTS.md

## Project Scope

This repository is HERMES, a hospital management system with:

- a React + Vite frontend in `frontend/`
- a Supabase backend workspace in `backend/supabase/`
- diagrams and setup notes in `docs/`

The app supports separate patient and doctor flows, including auth, profile completion, appointments, availability, and medical records.

## Repo Map

- `frontend/src/pages/` contains route-level screens.
- `frontend/src/pages/patient/` contains patient-facing pages.
- `frontend/src/pages/doctor/` contains doctor-facing pages.
- `frontend/src/components/layout/` contains app shell and navigation components.
- `frontend/src/components/ui/` contains reusable UI primitives.
- `frontend/src/hooks/` contains auth context and shared hooks such as `useFetch`.
- `frontend/src/features/auth/` contains auth/profile service logic.
- `frontend/src/lib/` contains shared helpers, constants, formatters, seed data, and the Supabase client.
- `frontend/src/routes/` defines the router and role guards.
- `backend/supabase/migrations/` contains the authoritative database change history.
- `backend/supabase/config.toml` contains local Supabase CLI configuration.
- `docs/` contains reference assets, not runtime code.

## Primary Stack

- Frontend: React 19, React Router 7, Vite 8
- Styling: Tailwind CSS with project-specific color and font tokens
- Backend/Auth/Data: Supabase
- Linting: ESLint flat config in `frontend/eslint.config.js`

## Working Rules

- Prefer editing existing patterns over introducing a new abstraction.
- Keep patient and doctor flows symmetric when behavior should match.
- Reuse `components/ui` building blocks before creating one-off markup.
- Use the shared Supabase client from `frontend/src/lib/supabase.js`; do not create duplicate clients.
- Keep auth-aware behavior inside the existing auth context and route guard patterns.
- Treat `backend/supabase/migrations/` as the source of truth for schema and policy changes.
- Do not commit secrets. Frontend Supabase config comes from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Do not edit `backend/supabase/.temp/`; it is local CLI state.

## Local Commands

From the repo root:

```bash
npm install
npm run build
```

Frontend development happens from `frontend/`:

```bash
cd frontend
npm install
npm run dev
npm run build
npm run lint
npm run preview
```

Supabase workflow from the repo root:

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

If local Supabase containers are needed, Docker Desktop must be available. Follow `docs/instructions.txt` for the existing team workflow.

## Validation Expectations

- For frontend changes, run `npm --prefix frontend run lint`.
- Run `npm --prefix frontend run build` for anything that may affect bundling, routing, or imports.
- There is no meaningful automated test suite in the root package today. Do not claim tests passed unless you actually ran a real command.
- If you add a Supabase migration, ensure the migration name clearly describes the change and check that the frontend code matches the new schema/policies.

## Code Conventions

- This codebase uses plain JavaScript and JSX, not TypeScript.
- Match the existing import style and semicolon-free formatting.
- Keep page components focused on screen logic; push reusable pieces into `components/`, `hooks/`, or `lib/` when repetition is real.
- Favor existing async patterns such as `useFetch` for read-heavy screens unless a change requires a different lifecycle.
- Preserve the existing Tailwind design language defined in `frontend/tailwind.config.js` and `frontend/src/index.css`.
- Keep route additions aligned with the current structure in `frontend/src/routes/index.jsx`.

## Backend Notes

- Review existing migrations before writing a new one; many changes here are row-level security and policy fixes.
- Avoid editing old migrations unless the task explicitly requires history surgery. Prefer a new forward-only migration.
- `backend/supabase/config.toml` references seed support, but no committed `seed.sql` is currently present. Do not assume seeded local data exists.

## When Updating This Repo

- Mention which area you changed: patient flow, doctor flow, shared UI, auth, or Supabase.
- Keep changes narrowly scoped. This repo already has active frontend work, so avoid unrelated cleanup.
- If a task touches both frontend behavior and database policy/schema, update both sides in the same change when possible.
