# Fókusz

A simple workspace for your team's tasks and projects: capture in one list, prioritize, and collaborate.

## Phase 1 (current)

- **Auth**: Sign in / sign up with Supabase (email + password)
- **Primary List**: Single section with draggable task/project cards
- **Quick Add**: Top bar input — type and Enter to add to Primary List
- **Detail panel**: Edit title, description, priority, due date, assignee, private; mark complete, delete
- **Reorder**: Drag to reorder within the list

## Pushing to GitHub

1. **Create a repo on GitHub**  
   - Go to [github.com](https://github.com) and sign in.  
   - Click the **+** (top right) → **New repository**.  
   - Name it `fokusz` (or any name you like).  
   - Leave “Add a README” **unchecked** (you already have one).  
   - Click **Create repository**.

2. **Connect and push from your machine**  
   On the new repo page, GitHub shows “…or push an existing repository from the command line.” Run those two commands in your project folder (replace `YOUR_USERNAME` with your GitHub username):

   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/fokusz.git
   git push -u origin main
   ```

   When prompted, sign in with your GitHub account (or use a [Personal Access Token](https://github.com/settings/tokens) if you use 2FA).

That’s it. Your Fókusz code will be on GitHub.

## Setup

**Quick start (no backend)**  
- Run `npm install` then `npm run dev`. With no Supabase env vars, the app uses **local mock data**: you’re logged in as “you@local.dev”, and tasks are stored in memory. Perfect for working on look and functionality first. A “Local” badge appears in the top bar.

**Connect Supabase later**
1. Create a project at [supabase.com](https://supabase.com).
2. Run the migration in `supabase/migrations/00001_initial.sql` (SQL Editor).
3. Copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Restart the dev server; the app will use Supabase and show the login screen. To force mock mode even with env set, add `VITE_USE_MOCK=true` to `.env`.

## Stack

- Vite + React + TypeScript
- Tailwind CSS
- Supabase (Auth, Postgres, Realtime)
- @dnd-kit (drag and drop)

## Next phases

- Phase 2: This Week + IceBox sections, filters
- Phase 3: Projects with subtasks, attachments
- Phase 4: Notifications, comments, Ask for Help
- Phase 5: Mobile, PWA, dark mode, keyboard shortcuts
