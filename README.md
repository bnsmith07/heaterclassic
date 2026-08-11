# Getting the Scoring App Live — Simple Version

This walks through getting the app online using just websites — no coding, no
command line typing. It looks long, but it's mostly clicking buttons and
copy/pasting two values.

**What each thing does, in one sentence:**
- **Supabase** = the database that stores everyone's scores live.
- **GitHub** = where the app's code lives so Vercel can find it.
- **Vercel** = the service that actually runs the app and gives you a real website link.

You already have accounts for all three. Total time: about 20 minutes.

---

## Step 1: Set up the database in Supabase

1. Go to supabase.com and open your project.
2. On the left sidebar, click **SQL Editor**.
3. Click **New query**.
4. Open the file called `supabase-schema.sql` (included in this download), select all the text in it, and copy it.
5. Paste it into the box in Supabase.
6. Click the **Run** button (usually bottom right).
7. You should see a success message. That's it — the database table **and** the photo/video gallery storage are both created by this one script.

## Step 2: Grab two values from Supabase

1. Still in Supabase, click **Project Settings** (gear icon, bottom left) → **API**.
2. You'll see a **Project URL** — copy it somewhere (a Notes app is fine for now).
3. Just below it, you'll see API keys. Copy the one labeled **anon** / **public**.
   (There's also one called `service_role` — ignore that one, don't copy it.)

You now have two things saved:
- A URL like `https://something.supabase.co`
- A long string of letters/numbers (the anon key)

## Step 3: Put the app's code on GitHub

1. Go to github.com and click the **+** in the top right → **New repository**.
2. Name it anything (e.g. `heater-scoring`). Leave everything else default. Click **Create repository**.
3. On the next page, look for a link that says **uploading an existing file** — click it.
4. Drag the entire unzipped `heater-app` folder contents into the upload box (all the files and folders — `src`, `package.json`, everything except the `.env.example` file, that one doesn't matter either way).
5. Scroll down, click **Commit changes**.

Your code is now on GitHub.

## Step 4: Connect it to Vercel

1. Go to vercel.com and click **Add New** → **Project**.
2. Find the repository you just created and click **Import**.
3. Vercel will likely detect it's a "Vite" project automatically — leave that as is.
4. Before clicking Deploy, look for a section called **Environment Variables**. Expand it.
5. Add two entries:
   - Name: `VITE_SUPABASE_URL` — Value: paste the Project URL from Step 2
   - Name: `VITE_SUPABASE_ANON_KEY` — Value: paste the anon key from Step 2
6. Click **Deploy**.
7. Wait a minute or two. When it's done, Vercel gives you a real link like `https://heater-scoring.vercel.app` — that's your live app.

---

## If something looks broken

- **The app loads but nothing saves / roster is empty:** you probably mistyped one of the two values in Step 4, or added them after deploying instead of before. Go to your Vercel project → **Settings** → **Environment Variables**, double check both are there correctly, then go to the **Deployments** tab and click **Redeploy**.
- **Score entered on one phone doesn't show on another:** give it about 7 seconds — it checks for updates on a short delay, not instantly.

## Using the app once it's live

- **You (admin) get in two ways:** open the link with `?me=p1` added to the end, or tap the title at the top of the app 5 times quickly and type PIN `1781`.
- **Everyone else:** go to the admin **Setup** tab, tap **Copy** next to each player's name, and text them that link. Opening it takes them straight to their own scorecard.
- **To edit anyone's score yourself:** admin-only **Edit Scores** tab.

## Making changes later

If you want something changed in the app itself, come back here and I'll edit
the code, then you re-upload it to GitHub (or I can walk you through it) and
Vercel updates automatically.

Good news: once this is live, changes to the app **no longer erase anyone's
scores** — the scores live in Supabase now, separate from the app's code. That
was a real limitation of the old Claude-hosted version; it's gone now.
