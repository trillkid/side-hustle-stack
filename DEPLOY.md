# Deploy to Vercel — Step-by-Step Guide

This guide takes you from zero to a live website in about 20 minutes. No coding experience needed.

## What you'll end up with

A real public URL (like `your-side-hustle.vercel.app`) where your Side Hustle Stack is live — Store, Freelance Hub, Affiliate reviews, LinkForge, and Job Tracker all working. You'll use this URL to:

- Sign up for Stripe (they need a website URL)
- Sign up for Amazon Associates (they need to see content)
- Share real links with real customers

---

## Step 1: Create a GitHub account (3 min)

GitHub is where your code lives. Vercel reads your code from GitHub and puts it on the internet.

1. Go to **github.com** → click **"Sign up"**
2. Use any email + create a password
3. Choose the free plan
4. Verify your email

Done.

## Step 2: Upload this project to GitHub (5 min)

You need to get this code onto GitHub. The easiest way:

### Option A — Using GitHub's web upload (no tools needed)

1. Go to **github.com/new**
2. Repository name: `side-hustle-stack`
3. Set to **Private** (your choice — Public is fine too)
4. Check **"Add a README file"**
5. Click **"Create repository"**
6. Click **"uploading an existing file"** (look for this link)
7. Drag ALL the files from this project folder into the upload area
   - **Important:** Do NOT upload these folders: `node_modules`, `.next`, `db`
   - Upload everything else (src, prisma, public, package.json, etc.)
8. Click **"Commit changes"**

### Option B — Using the command line (if you have git installed)

```bash
cd /home/z/my-project
git init
git add -A
git commit -m "Side Hustle Stack"
# Then follow GitHub's instructions to push to a new repo
```

## Step 3: Create a Vercel account (2 min)

1. Go to **vercel.com** → click **"Sign Up"**
2. Click **"Continue with GitHub"** (use the GitHub account you just made)
3. Authorize Vercel

Done.

## Step 4: Create a Turso database (3 min)

Turso is a free cloud database. Your app needs this because Vercel doesn't have a local database.

1. Go to **turso.tech** → click **"Start for free"**
2. Sign in with GitHub (same account)
3. Click **"New database"**
4. Name it: `side-hustle`
5. Click **"Create"**
6. Once created, click on the database name
7. Copy these two values (you'll need them in Step 6):
   - **URL** (looks like `libsql://side-hustle-xxxx.turso.io`)
   - **Auth Token** (click "Create token" if you don't see one, then copy it)

## Step 5: Deploy to Vercel (3 min)

1. Go to **vercel.com/dashboard** → click **"Add New"** → **"Project"**
2. Find your `side-hustle-stack` repo → click **"Import"**
3. Vercel auto-detects Next.js — leave the settings as-is
4. **Before clicking Deploy**, expand **"Environment Variables"** and add these:

| Name | Value |
|------|-------|
| `DATABASE_URL` | *(paste your Turso URL from Step 4)* |
| `DATABASE_AUTH_TOKEN` | *(paste your Turso auth token from Step 4)* |

5. Click **"Deploy"**
6. Wait ~2 minutes for the build to finish
7. You'll get a URL like `side-hustle-stack.vercel.app` — **that's your live website!**

## Step 6: Seed the database (1 min)

Your live website needs demo data. Vercel doesn't run seed scripts automatically, so we built a one-click endpoint.

1. Open your browser
2. Go to: `https://YOUR-VERCEL-URL.vercel.app/api/setup`
3. You should see a JSON response like: `{"ok":true,"message":"Database seeded successfully!"}`
4. That's it — your live site now has products, articles, services, etc.

## Step 7: Add Stripe + Amazon keys to Vercel (2 min)

If you've already added your Stripe keys in the app's Settings tab locally, you need to add them to Vercel too (Vercel has its own environment).

**Option A — Through the app's Settings tab (easiest):**
1. Go to your live Vercel URL
2. Click the **Settings** tab
3. Paste your Stripe keys + Amazon tag
4. Click **Save settings**
5. This saves them to the Turso database, so they work immediately.

**Option B — Through Vercel dashboard (alternative):**
1. Go to **vercel.com** → your project → **Settings** → **Environment Variables**
2. Add any keys you want as environment variables (optional — the app stores them in the DB)

## Step 8: Use your URL for Stripe + Amazon signups

Now that you have a live website:

**For Stripe:**
- Use your Vercel URL as the "business website" when signing up
- They'll see a real, working store — approved immediately

**For Amazon Associates:**
- Use your Vercel URL as the "website"
- Amazon will review it and see your affiliate review articles (real content!)
- Approval usually takes 1-3 days
- Once approved, add your Amazon tag in the **Settings** tab

---

## Troubleshooting

**"Build failed on Vercel"**
- Check that you uploaded ALL files (especially `package.json`, `prisma/schema.prisma`, and the entire `src/` folder)
- Make sure you did NOT upload `node_modules` or `.next`

**"Database error" on the live site**
- Verify your Turso URL and auth token are correct in Vercel's environment variables
- Make sure the URL starts with `libsql://`

**The site loads but data is missing**
- Visit `https://YOUR-URL.vercel.app/api/setup` to seed the database
- You should see `{"ok":true}` in the response

**Stripe checkout not working on the live site**
- Make sure you added your Stripe keys in the Settings tab on the LIVE site (not just locally)
- Use test keys (`sk_test_...`, `pk_test_...`) first to verify, then switch to live keys

**Need to update the code after deployment?**
- Push new changes to your GitHub repo
- Vercel automatically rebuilds and deploys (takes ~2 min)

---

## Your URLs (fill these in after deploying)

- **Live website:** `https://________________.vercel.app`
- **Store link to share:** `https://________________.vercel.app/#` (click Store tab)
- **Freelance link to share:** `https://________________.vercel.app/#` (click Freelance tab)
- **Affiliate articles:** `https://________________.vercel.app/#` (click Affiliate tab)
- **Settings (private):** `https://________________.vercel.app/#` (click Settings tab)

Share your store and freelance links on social media, with friends, in local groups — that's how you get real customers.
