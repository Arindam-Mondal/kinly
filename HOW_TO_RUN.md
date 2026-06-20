# Running Kinly locally & viewing the UI

A step-by-step guide to start the app and look at it in your browser — including
**mobile view**, which is the primary way Kinly is meant to be used.

> Commands use `corepack pnpm` because pnpm runs via Corepack here (a bare `pnpm`
> may not be on your PATH). Run everything from the project root:
> `C:\Users\amond07\Workspace\kinly`.

---

## One-time setup (only needed the first time)

1. **Make sure Docker Desktop is running.** The local database/auth run in Docker.
   You should see the Docker whale icon in your system tray.

2. **Install dependencies:**
   ```
   corepack pnpm install
   ```

3. **Create your local env file.** Copy the example, then fill it from Supabase:
   ```
   copy .env.example .env.local
   ```
   You'll fill the values in step 2 below (after the stack is up).

---

## Every time you want to run the app

You need **two things running**: the Supabase stack (database/auth) and the Next.js
dev server. Use two terminal windows, or run the first one and leave it.

### 1. Start the local Supabase stack
```
corepack pnpm exec supabase start
```
First run downloads Docker images (slow, one-time). When it finishes it prints a block
of URLs and keys. Leave it running.

### 2. Put the local keys into `.env.local`
Get the values:
```
corepack pnpm exec supabase status
```
Copy them into `.env.local` so it looks like this (the local keys are the same on every
machine — they're demo keys, not secrets):
```
NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<the ANON_KEY value>"
SUPABASE_SERVICE_ROLE_KEY="<the SERVICE_ROLE_KEY value>"
```
> You only need to do this once unless you reset the stack. It's likely already filled in.

### 3. Start the app
```
corepack pnpm dev
```
Wait for `Ready`, then open **http://localhost:3000** in your browser.

You'll be redirected to the **login** page (you're not signed in yet).

---

## See it in MOBILE view (recommended)

Kinly is designed phone-first, so look at it at phone width:

**Chrome / Edge:**
1. Open http://localhost:3000
2. Press **F12** to open DevTools.
3. Press **Ctrl + Shift + M** to toggle the device toolbar.
4. At the top, pick a device like **iPhone 14 Pro** or **Pixel 7** (or set width ~390px).
5. Refresh the page.

**Firefox:** press **Ctrl + Shift + M** for Responsive Design Mode.

---

## What you can try right now

The app so far covers **accounts/auth** (build steps 1–3). The calendar, dashboard,
and insights screens are still placeholders.

1. **Register** — from the login page, click "Create an account". Fill in name, email,
   a password (8+ chars with a number — watch the strength meter), age, and sex.
   Submitting takes you to a short **onboarding** placeholder.
2. **Home** — click "Get started". You'll see a "Hi, &lt;name&gt; 👋" placeholder with a
   **Sign out** button. (This confirms login, the session, and your profile all work.)
3. **Sign out**, then **log in** again with the same email/password.
4. **Forgot password** — on the login page click "Forgot?", enter your email, submit.
   See the next section to read the email locally.

### Reading the password-reset email (local)
Local Supabase captures outgoing email in **Mailpit**. Open:
```
http://127.0.0.1:54324
```
Open the reset email and click its link to land on the "Choose a new password" screen.

### Looking at the database (optional)
Supabase Studio lets you browse the `profiles` and `log_entries` tables:
```
http://127.0.0.1:54323
```

---

## Stopping everything

- Stop the dev server: press **Ctrl + C** in its terminal.
- Stop Supabase (keeps your data):
  ```
  corepack pnpm exec supabase stop
  ```

---

## Troubleshooting

- **`supabase start` fails on a container health check.** `storage` and `analytics`
  are already disabled in `supabase/config.toml` because they fail on Windows/older
  Docker. If a different one fails, paste the error. To recover a stuck stack:
  ```
  corepack pnpm exec supabase stop --no-backup
  corepack pnpm exec supabase start
  ```
- **Login/register page errors about Supabase.** Your `.env.local` is missing or
  doesn't match `supabase status` — redo step 2, then restart `corepack pnpm dev`.
- **Port 3000 already in use.** Another dev server is running; stop it, or Next will
  offer the next free port (watch the terminal for the actual URL).
- **`pnpm` not found.** Prefix with `corepack` as shown above.

---

## Quick reference

| What | URL |
|---|---|
| App | http://localhost:3000 |
| Email inbox (Mailpit) | http://127.0.0.1:54324 |
| Database UI (Studio) | http://127.0.0.1:54323 |
