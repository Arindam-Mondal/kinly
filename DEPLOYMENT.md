# Deploying Kinly to Vercel + Supabase

This guide takes you from a clean checkout to a live, production Kinly deployment on
**Vercel** (Next.js host) backed by a **hosted Supabase** project (Postgres + Auth + RLS).

Follow it top to bottom. Every step is copy-pasteable. No prior knowledge of the codebase
is assumed.

> **Time:** ~30–45 minutes. **Cost:** $0 — both Vercel Hobby and Supabase Free tiers are enough.

---

## Table of contents

1. [What you're deploying](#1-what-youre-deploying)
2. [Prerequisites](#2-prerequisites)
3. [Part A — Create the hosted Supabase project](#part-a--create-the-hosted-supabase-project)
4. [Part B — Push the database schema (migrations)](#part-b--push-the-database-schema-migrations)
5. [Part C — Configure Supabase Auth](#part-c--configure-supabase-auth)
6. [Part D — Deploy to Vercel](#part-d--deploy-to-vercel)
7. [Part E — Point Auth back at your Vercel domain](#part-e--point-auth-back-at-your-vercel-domain)
8. [Part F — Smoke-test the live app](#part-f--smoke-test-the-live-app)
9. [Environment variables reference](#environment-variables-reference)
10. [Redeploying & updating the schema](#redeploying--updating-the-schema)
11. [Troubleshooting](#troubleshooting)
12. [Security notes](#security-notes)

---

## 1. What you're deploying

| Layer | Technology | Where it runs |
|---|---|---|
| App (UI, Server Actions, middleware) | Next.js 16 (App Router), React 19 | **Vercel** |
| Database, Auth, Row Level Security | Supabase (Postgres) | **Supabase cloud** |
| Package manager | pnpm (via the committed `pnpm-lock.yaml`) | Vercel build |

The app talks to Supabase directly — there is no separate API server. At runtime the app
needs only two public Supabase values (URL + anon key); everything is protected by
Row Level Security in the database.

---

## 2. Prerequisites

Create these free accounts and install these tools first:

- [ ] A **GitHub** account, and this repository pushed to it (Vercel deploys from GitHub).
- [ ] A **Vercel** account → <https://vercel.com/signup> (sign in with GitHub).
- [ ] A **Supabase** account → <https://supabase.com/dashboard> (sign in with GitHub).
- [ ] **Node.js 20+** and **Corepack** locally (Corepack ships with Node; it runs the pinned
      pnpm). Verify:
  ```bash
  node -v      # should print v20.x or newer
  corepack --version
  ```

> You do **not** need Docker for deployment. Docker is only for the *local* Supabase stack
> (see `HOW_TO_RUN.md`). For production you use Supabase cloud.

### Push the repo to GitHub (if you haven't)

```bash
# from the project root
git remote -v                      # check if a remote already exists
# if none, create a repo on github.com then:
git remote add origin https://github.com/<you>/kinly.git
git push -u origin main
```

---

## Part A — Create the hosted Supabase project

1. Go to <https://supabase.com/dashboard> → **New project**.
2. Fill in:
   - **Name:** `kinly` (any name).
   - **Database Password:** generate a strong one and **save it** — you need it in Part B.
   - **Region:** pick the one closest to your users (ideally the same region you'll choose
     for Vercel, to keep latency low).
3. Click **Create new project** and wait ~2 minutes for it to provision.

### Collect your API credentials

In the new project, go to **Project Settings → API** (gear icon in the sidebar). Keep this
tab open — you'll paste three values into Vercel later:

| Dashboard field | Use as | Notes |
|---|---|---|
| **Project URL** | `NEXT_PUBLIC_SUPABASE_URL` | e.g. `https://abcdefgh.supabase.co` |
| **anon / public key** (newer dashboards: **Publishable key**) | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Safe to expose to the browser; RLS protects the data |
| **service_role key** (newer dashboards: **Secret key**) | *(optional — see below)* | **Secret. Never expose.** Not needed by the app at runtime |

Also note your **Project Reference ID** (the `abcdefgh` part of the URL, also shown under
**Project Settings → General → Reference ID**). You need it for `supabase link`.

> **About the service-role key:** the Kinly app code never reads it in production — only the
> two `NEXT_PUBLIC_*` values are used by the browser, server components, and middleware. The
> service-role key is used only by the local **test** helper. So you can skip adding it to
> Vercel. If a future server-only feature needs it, add it as a plain (non-`NEXT_PUBLIC_`)
> environment variable. Never prefix it with `NEXT_PUBLIC_`.

---

## Part B — Push the database schema (migrations)

The schema (the `profiles` and `log_entries` tables, all RLS policies, and the
`handle_new_user` trigger) lives as SQL migrations in `supabase/migrations/`. You must apply
them to your new cloud database. Pick **one** of the two methods below.

### Method 1 (recommended) — Supabase CLI

The CLI is already a dev-dependency of this repo, run via Corepack.

```bash
# 1. Install dependencies
corepack pnpm install

# 2. Log in to the Supabase CLI (opens a browser to grab an access token)
corepack pnpm exec supabase login

# 3. Link this repo to your cloud project (use your Reference ID from Part A)
corepack pnpm exec supabase link --project-ref <your-project-ref>
#    → it will prompt for the Database Password you saved in Part A.

# 4. Push all migrations to the cloud database
corepack pnpm exec supabase db push
```

You should see both migrations applied:

```
Applying migration 20260620130749_init.sql...
Applying migration 20260620155649_auth_profile_trigger.sql...
Finished supabase db push.
```

### Method 2 — paste SQL in the dashboard (no CLI)

1. In the Supabase dashboard, open **SQL Editor → New query**.
2. Open `supabase/migrations/20260620130749_init.sql` from the repo, copy its entire
   contents, paste into the editor, and click **Run**.
3. Repeat for `supabase/migrations/20260620155649_auth_profile_trigger.sql`.
4. Run them **in that order** (the trigger migration depends on the tables from the first).

### Verify the schema

In the dashboard:

- **Table Editor** → you should see `profiles` and `log_entries`.
- **Authentication → Policies** (or **Database → Policies**) → both tables show **RLS enabled**
  with owner-scoped policies (`auth.uid() = user_id`). If RLS is *not* enabled on a table,
  stop — the migration didn't apply correctly; re-run Part B.
- **Database → Functions** → `handle_new_user` exists.

> RLS is the only thing protecting users' health data. Do not disable it.

---

## Part C — Configure Supabase Auth

The local config (`supabase/config.toml`) disables email confirmation so sign-up is instant
and the `profiles` row is created automatically by the database trigger. **That config does
not apply to the cloud project** — you must mirror the important parts in the dashboard.

1. Go to **Authentication → Sign In / Providers → Email** (older dashboards:
   **Authentication → Providers → Email**).
2. **Turn OFF "Confirm email."** This matches the app's intended behavior (auto-confirm;
   profile created by the `handle_new_user` trigger). If you leave it on, new users can't log
   in until they click an emailed link, and the free built-in email service is heavily
   rate-limited — so only leave it on if you've set up custom SMTP (next note).
3. Confirm **Allow new users to sign up** is **enabled**.

> **Email delivery (password reset, optional confirmations):** Supabase's built-in email
> sender is for testing only and is rate-limited to a few messages per hour. The
> "Forgot password" flow will work for light testing out of the box. For real usage, set up
> **custom SMTP** under **Authentication → Emails → SMTP Settings** (e.g. Resend, SendGrid,
> Postmark).

We'll set the **Site URL** and **Redirect URLs** in Part E, once you know your Vercel domain.

---

## Part D — Deploy to Vercel

1. Go to <https://vercel.com/new>.
2. **Import** your `kinly` GitHub repository.
3. Vercel auto-detects the framework:
   - **Framework Preset:** Next.js ✅ (leave as detected)
   - **Build Command / Output:** leave as default (Vercel uses `next build`).
   - **Install Command:** leave as default — Vercel sees `pnpm-lock.yaml` and uses pnpm
     automatically. (Optional: to pin the pnpm version, add
     `"packageManager": "pnpm@<version>"` to `package.json` and commit it.)
4. Expand **Environment Variables** and add the two required values from Part A
   (apply them to **Production**, **Preview**, and **Development**):

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | your Project URL, e.g. `https://abcdefgh.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon / publishable key |

   *(Skip `SUPABASE_SERVICE_ROLE_KEY` unless you've added a server feature that needs it.)*
5. Click **Deploy** and wait for the build to finish (~1–2 minutes).
6. Vercel gives you a production URL like `https://kinly-xxxx.vercel.app`. **Copy it** — you
   need it in Part E.

> The first load after deploy may show auth errors until you finish Part E, because Supabase
> doesn't yet trust your Vercel domain for redirects. That's expected.

---

## Part E — Point Auth back at your Vercel domain

So that login redirects and password-reset email links land on your live site:

1. Supabase dashboard → **Authentication → URL Configuration**.
2. **Site URL:** set to your production domain, e.g. `https://kinly-xxxx.vercel.app`
   (no trailing slash). Use your custom domain here if you've added one in Vercel.
3. **Redirect URLs:** add **both** of these so production *and* Vercel preview deployments
   work:
   ```
   https://kinly-xxxx.vercel.app/**
   https://*-<your-vercel-scope>.vercel.app/**
   ```
   - The first line covers your production domain.
   - The second wildcard covers Vercel's per-branch preview URLs. Replace
     `<your-vercel-scope>` with your Vercel team/username slug (look at any preview URL to
     find the pattern), or simply add specific preview URLs as you need them.
   - If you later add a **custom domain** in Vercel, add `https://yourdomain.com/**` here too
     and update the Site URL.
4. **Save.**

No redeploy is needed for this change — it takes effect immediately on Supabase's side.

---

## Part F — Smoke-test the live app

Open your production URL and walk the core flow:

1. **Register** — create an account (name, email, password, age, sex). You should be signed
   in immediately and land in the app (no email-confirmation wall). ✅ confirms Auth config
   (Part C) and the profile trigger (Part B).
2. **Log a period** — go to **Calendar**, tap a start date then an end date, save in the
   bottom sheet. ✅ confirms `log_entries` writes + RLS.
3. **Home** — the dashboard should show real cycle metrics. ✅ confirms reads + the
   prediction engine.
4. **Sign out**, then **Log in** again. ✅ confirms sessions/middleware.
5. **Forgot password** — request a reset email (works for light testing via the built-in
   sender; needs SMTP for production volume). The link should return you to the live site's
   reset screen. ✅ confirms Site URL + redirect allowlist (Part E).

If all five pass, you're live. 🎉

---

## Environment variables reference

| Variable | Required? | Exposed to browser? | Where it's set | Purpose |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Yes | Vercel | Supabase project URL the client/server SDKs connect to |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Yes | Vercel | Public anon/publishable key; data still gated by RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | No (tests only) | **Never** | local `.env.local` | Admin key used by the test helper; not read by the app at runtime |

- Anything prefixed `NEXT_PUBLIC_` is **bundled into the browser** — only ever put non-secret
  values there.
- After changing an environment variable in Vercel, you must **redeploy** for it to take
  effect (Vercel → Deployments → ⋯ → Redeploy, or push a commit).

---

## Redeploying & updating the schema

**App code changes:** push to your GitHub branch.
- Push to `main` → Vercel builds and updates **production** automatically.
- Push to any other branch / open a PR → Vercel publishes a **preview** deployment.

**Database changes:** never edit the cloud DB by hand. Create a migration and push it:

```bash
corepack pnpm exec supabase migration new <description>
# edit the new file under supabase/migrations/
corepack pnpm exec supabase db push
```

This keeps the repo's migrations the single source of truth, so a fresh environment can be
rebuilt from scratch.

---

## Troubleshooting

**Build fails on Vercel with pnpm/lockfile errors.**
Ensure `pnpm-lock.yaml` and `pnpm-workspace.yaml` are committed (they are, by default — don't
`.gitignore` them). The workspace file's `allowBuilds`/`verifyDepsBeforeRun` settings are
load-bearing; don't remove them.

**App loads but every page bounces to `/login`, or shows "Invalid API key".**
The Supabase env vars are missing or wrong in Vercel. Re-check `NEXT_PUBLIC_SUPABASE_URL`
(no trailing slash, includes `https://`) and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, then redeploy.

**Sign-up succeeds but login says "Email not confirmed."**
Email confirmation is still ON in the cloud project. Turn it OFF (Part C), or set up SMTP and
have users confirm via the email.

**Registration fails / no `profiles` row appears.**
The trigger migration didn't apply. Re-run Part B and verify `handle_new_user` exists under
**Database → Functions** and `on_auth_user_created` exists as a trigger on `auth.users`.

**Password-reset / confirmation email link goes to `localhost` or 404s.**
Site URL / Redirect URLs aren't set to your Vercel domain. Fix Part E.

**Users can see each other's data.**
RLS isn't enabled. Stop and re-apply Part B — every table must have RLS on with owner-scoped
policies before real users touch the app.

**Permission/"row violates row-level security policy" errors on writes.**
Usually means the session cookie isn't reaching the server (middleware misconfig) or the user
isn't authenticated. Confirm you completed Parts D + E and the env vars are present on the
**Production** environment specifically.

---

## Security notes

- This is health data. Keep **RLS enabled on every table** — it is the entire access-control
  model.
- The **service-role key bypasses RLS**. Never put it in a `NEXT_PUBLIC_` variable, never
  commit it, and don't add it to Vercel unless a server-only feature requires it.
- Passwords are handled entirely by Supabase Auth (hashed); the app never sees or stores them.
- Use a **strong, unique database password** (Part A) and store it in a password manager.
- For anything beyond testing, configure **custom SMTP** so auth emails are reliable and not
  rate-limited.
- Prefer a **custom domain** with HTTPS (Vercel provisions certs automatically) for a
  trustworthy, installable PWA experience.
```
