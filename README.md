# Shelfie

A personal book memory shelf — add books, look up details from Open Library, and take AI-generated memory quizzes.

## Deploy to Vercel (free)

1. **Push this folder to GitHub** (create a repo and push).

2. **Import on Vercel**
   - Go to [vercel.com](https://vercel.com) and sign in with GitHub
   - **Add New Project** → import your Shelfie repo
   - Leave build settings as default (no build command needed)

3. **Add your Gemini API key**
   - In the project: **Settings → Environment Variables**
   - Name: `GEMINI_API_KEY`
   - Value: paste your key exactly as provided (e.g. starting with `AQ.` — no prefix added by the app)
   - Apply to Production, Preview, and Development

4. **Deploy** — Vercel gives you a public URL like `https://shelfie-xxx.vercel.app`

Anyone can open that URL; quizzes call `/api/quiz` on the same domain (no local server).

## Run locally

```bash
npm install
cp .env.example .env
# Edit .env and set GEMINI_API_KEY=...

npm start
# Open http://localhost:3001
```

Or use the Vercel dev server (matches production):

```bash
npx vercel dev
```

## Project layout

- `public/index.html` — frontend app
- `api/quiz.js` — serverless quiz endpoint (Vercel)
- `server.js` — optional local dev server
