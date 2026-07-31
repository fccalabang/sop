# Media Team Rundown

A weekend checklist app for the church media team. Pick your name, see your
role's tasks for Saturday and Sunday, check them off. Past weekends are kept
in a history log.

## 1. Set up Supabase (free database)

1. Go to https://supabase.com → create a free account → New Project.
2. Once it's created, open **SQL Editor** → New query.
3. Paste the contents of `supabase/schema.sql` and click **Run**.
   This creates the tables and seeds sample roles/tasks/members —
   edit the task descriptions and member names in that file first if you
   want, or just adjust the data directly in Supabase's **Table Editor**
   afterward.
4. Go to **Project Settings → API**. Copy:
   - `Project URL` → this is `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → this is `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. Run locally (optional, to test before deploying)

```bash
npm install
cp .env.local.example .env.local
# paste your Supabase URL and anon key into .env.local
npm run dev
```

Visit http://localhost:3000

## 3. Push to GitHub

```bash
git init
git add .
git commit -m "Media team rundown app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## 4. Deploy on Vercel (free plan)

1. Go to https://vercel.com → New Project → import the GitHub repo.
2. In the import screen, add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Click Deploy. Vercel will auto-redeploy on every future push to `main`.

## Managing your team

- **Add/remove members or change roles:** edit the `members` table directly
  in Supabase's Table Editor — no redeploy needed.
- **Change tasks per role:** edit the `tasks` table the same way. Since
  tasks are the same every week, you only edit them once, not per weekend.
- **History:** every checked task is saved permanently against its date, so
  the `/history` page always shows the full record automatically.

## A note on access

There's no login system — team members just pick their name from a
dropdown, since this is meant for a small trusted team. Don't publicize
the URL publicly; treat it like an internal team link.
