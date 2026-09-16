# HERMES

HERMES is a role-based hospital management system for coordinating appointments, patient records, clinician availability, and administrative workflows. It provides separate workspaces for patients, doctors, and administrators, backed by Supabase authentication and a Postgres database.

## What it supports

- **Patients:** create an account, maintain a profile, book appointments from available slots, track appointments, view connected doctors, and access medical records.
- **Doctors:** complete a professional profile, set availability, manage appointments, review patient information, and create or update clinical records.
- **Administrators:** manage users, appointments, records, and availability across the system.
- **Access control:** authenticated routes and role-specific dashboards keep each workspace scoped to the appropriate user type.

## Technology

- React 19, Vite, React Router, Tailwind CSS, and Lucide icons
- Supabase Auth, Postgres, Row Level Security policies, migrations, and Edge Functions
- Vitest and Testing Library for frontend tests

## Project layout

```text
frontend/                  React application
  src/pages/               Patient, doctor, admin, and auth screens
  src/components/          Shared UI and layout components
  src/routes/              Route definitions and role guards
  src/hooks/               Auth and data-fetching hooks
backend/supabase/          Supabase configuration, migrations, and functions
  migrations/              Database schema and policy changes
  functions/               Edge Functions and shared server-side utilities
docs/                      Database diagrams and project documentation
demo/                      OpenRouter latency test utility
```

## Prerequisites

- Node.js 20 or later
- Docker Desktop (required for local Supabase)
- Supabase CLI (available through the root project dependency or `npx`)

## Getting started

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/Jayk8888/HERMES_internal.git
   cd HERMES_internal
   npm install
   npm --prefix frontend install
   ```

2. Create `frontend/.env.local` with your Supabase project values:

   ```dotenv
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

3. Configure the database. For a hosted Supabase project, authenticate, link it, and apply the migrations:

   ```bash
   npx supabase login
   npx supabase link --project-ref your-project-ref
   npx supabase db push
   ```

   Alternatively, start a local Supabase stack from `backend/supabase`:

   ```bash
   cd backend/supabase
   npx supabase start
   ```

4. Start the frontend:

   ```bash
   npm --prefix frontend run dev
   ```

   Vite prints the local application URL, normally `http://localhost:5173`.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run build` | Build the frontend for production. |
| `npm --prefix frontend run dev` | Run the Vite development server. |
| `npm --prefix frontend run lint` | Lint frontend code. |
| `npm --prefix frontend run test` | Run the frontend test suite. |
| `npm run demo:openrouter-latency` | Run the OpenRouter latency utility; see [`demo/README.md`](demo/README.md). |

## Database and backend

The Supabase project configuration lives in `backend/supabase`. Database schema and permission changes are versioned in `backend/supabase/migrations`; apply them with `npx supabase db push` after linking a project. Review the diagrams in `docs/` for the relational model.

Edge Functions use environment variables supplied by Supabase. Keep credentials such as `OPENROUTER_API_KEY`, service-role keys, and local `.env` files out of source control.

## Contributing

Create a branch for your work, keep migrations additive and ordered, and run the frontend lint, tests, and build before opening a pull request.

## Team

Riddhimaan Dwivedi, Jai M. Kawade, Sreehari K., Raghav Goenka, Rahul Sunil, and Abhijith S. Kumar.
