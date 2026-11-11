# Deck Eval Web

Next.js frontend for the Deck Eval Platform. It needs the separate `deck-eval-api` server running.

Stack: Next.js 15 (App Router), React 19, Tailwind 4 with the PRD design tokens in `app/globals.css`, Radix dialogs and popovers, Tiptap for the brief editor, dnd-kit for reordering slides and rubric fields.

## Run locally

Start `deck-eval-api` first (default http://localhost:4000), then:

```bash
cp .env.example .env.local     # API_URL=http://localhost:4000
pnpm install
pnpm dev                       # http://localhost:3000
```

Sign in with the API's seeded users, for example `admin@deckeval.local` / `admin12345` or `rater1@deckeval.local` / `password123`.

All browser calls go to `/api/*` on this app, and `next.config.ts` rewrites them to `API_URL`. That keeps the session cookie first-party, so the two apps can live on different hosts without CORS. Server components call the API directly and forward the cookie.

## Pages

| Route | Who | |
|---|---|---|
| `/login` | all | Password or magic link |
| `/` | everyone | Next task, returned, in progress, completed |
| `/tasks/[id]` | rater | Workspace: brief, response tabs, slides and lightbox, rating panel, autosave, timer, submit |
| `/review`, `/review/[submissionId]` | reviewer, admin | Queue and review view with per-field comments, return or approve |
| `/admin` | admin | Stats and escalations |
| `/admin/tasks`, `/admin/tasks/new`, `/admin/tasks/[id]/edit`, `/admin/tasks/[id]/preview` | admin | Task list, 5-step builder, preview as rater |
| `/admin/templates`, `/admin/templates/[id]` | admin | Rubrics with live preview, and projects |
| `/admin/users`, `/admin/tags`, `/admin/exports` | admin | Management and CSV/JSON export |
| `/design` | signed in | Tokens and base components |

## Deploy to Vercel

1. Push this repo to GitHub. In Vercel, choose **Add New → Project** and import it. Vercel detects Next.js, so there's nothing to change in the build settings.
2. Add the environment variable `API_URL` with your Railway API domain, e.g. `https://deck-eval-api-production.up.railway.app` (no trailing slash).
3. Deploy. Then set `WEB_URL` on the Railway API to this Vercel URL and redeploy the API, so magic links point here.

The browser only talks to the Vercel domain. `/api/*` is forwarded to Railway, so login cookies are set on your Vercel domain and no CORS setup is needed. Upload requests don't run through Vercel Functions, so the 4.5 MB function body limit doesn't apply.

## Checks

```bash
pnpm typecheck && pnpm lint && pnpm test
pnpm e2e        # Playwright against a running API (seeded) and web app
```

The e2e test runs the full PRD flow: an admin creates and publishes a three-response task, a rater submits, the reviewer returns it, the rater resubmits, the reviewer approves and the admin exports CSV. Set `CHROME_PATH` to use an installed Chrome, or run `npx playwright install chromium` once.

`lib/shared/` holds the rubric types and logic, a copy of `src/shared/` in the API. Keep the two in step.
