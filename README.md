# Who's the Impostor: Twist Edition 🕵️

A modern, full-stack **multiplayer social deduction party game** built entirely with Next.js 15 — no dedicated server, no WebSockets, no Firebase. Fully deployable on **Vercel** in minutes.

---

## ✨ Features

| | |
|---|---|
| 🎭 | **Social Deduction** — 4–12 players, secret roles, find the Impostor |
| 🌪️ | **15 Unique Twists** — every round plays differently |
| ⚡ | **11 Special Abilities** — strategic single-use power cards |
| 🏆 | **4 Game Modes** — Classic, Chaos, Ranked (Bronze→Master), Custom |
| 🎨 | **Rich Cosmetics** — avatars, borders, titles, emotes, vote effects |
| 📅 | **Daily Events** — global modifiers that rotate every day |
| 🎯 | **Missions & Achievements** — weekly quests, 30+ achievements |
| 🔒 | **Cheat-proof** — all secret data stays server-side until reveal |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router + Server Actions) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + Framer Motion |
| Auth | NextAuth v5 — JWT sessions |
| Database | Prisma ORM · SQLite (dev) / Vercel Postgres (prod) |
| State | Zustand |
| Multiplayer | Optimistic polling via Route Handlers |
| Deployment | Vercel (zero config) |

---

## 🚀 Local Development

```bash
# 1. Clone
git clone https://github.com/JBLOBRICO/whostheimpostor.git
cd whostheimpostor

# 2. Install dependencies
npm install

# 3. Create your .env file
cp .env.example .env
# Edit .env — the defaults work for local dev as-is

# 4. Set up SQLite database
npm run db:push    # creates prisma/dev.db
npm run db:seed    # seeds words, achievements, cosmetics

# 5. Start the dev server
npm run dev
# → http://localhost:3000
```

---

## ☁️ Deploy to Vercel

### Step 1 — Add Vercel Postgres

1. Open your project on [vercel.com](https://vercel.com)
2. Go to **Storage** → **Create Database** → **Postgres**
3. Vercel will automatically add these env vars to your project:
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL` ← used as `DATABASE_URL`
   - `POSTGRES_URL_NON_POOLING`

### Step 2 — Set Environment Variables

In **Vercel → Project → Settings → Environment Variables**, add:

| Key | Value |
|---|---|
| `DATABASE_URL` | *(paste your `POSTGRES_PRISMA_URL` value)* |
| `NEXTAUTH_SECRET` | *(run `openssl rand -base64 32` to generate)* |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` |
| `SEED_SECRET` | *(any random string — used to protect the seed endpoint)* |

### Step 3 — Switch schema to PostgreSQL

Before deploying, copy the production schema:

```bash
# On your machine before git push:
cp prisma/schema.postgresql.prisma prisma/schema.prisma
git add prisma/schema.prisma
git commit -m "chore: switch to postgresql for production"
git push
```

> ⚠️ Keep `prisma/schema.prisma` as SQLite for local dev. Only swap it when deploying.
> The `prisma/schema.postgresql.prisma` file is your production-ready backup.

### Step 4 — Deploy

Vercel auto-deploys on every push. The `vercel.json` build command:
```
prisma generate && prisma db push && next build
```
automatically creates the Postgres schema on first deploy.

### Step 5 — Seed the Production Database

After first deploy, hit the seed endpoint once:

```bash
curl -X POST https://your-app.vercel.app/api/seed \
  -H "Authorization: Bearer YOUR_SEED_SECRET"
```

This populates words, achievements, cosmetics, missions, and the first daily event.

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth handlers
│   │   ├── daily-event/          # Today's global event
│   │   ├── room/[roomId]/
│   │   │   ├── state/            # Room state polling endpoint
│   │   │   └── messages/         # Chat polling endpoint
│   │   └── seed/                 # One-time DB seed endpoint
│   ├── dashboard/                # Main menu
│   ├── room/[code]/              # Live game room
│   ├── profile/                  # Player profile & cosmetics
│   ├── shop/                     # Cosmetic shop
│   ├── leaderboard/              # Global rankings
│   ├── login/ & register/        # Auth pages
│   └── page.tsx                  # Landing page
├── components/
│   ├── auth/                     # Login & register forms
│   ├── dashboard/                # Dashboard UI
│   ├── game/                     # All in-game components
│   │   ├── game-phase.tsx        # Discussion + voting UI
│   │   ├── game-reveal.tsx       # End-of-round reveal
│   │   ├── game-chat.tsx         # Real-time chat
│   │   ├── word-reveal.tsx       # Secret role/word card
│   │   ├── ability-card.tsx      # Special ability UI
│   │   └── twist-reveal-overlay  # Animated twist announcement
│   ├── room/                     # Room lobby + game shell
│   ├── shop/ & profile/          # Shop and profile UIs
│   └── ui/                       # Button, Card, Badge, Input…
├── lib/
│   ├── actions/                  # Server Actions (auth/room/game/profile)
│   ├── game-data/                # Words, twists, abilities, cosmetics, achievements
│   ├── game-engine.ts            # Core game logic — server-side only
│   ├── auth.ts                   # NextAuth config
│   └── db.ts                     # Prisma client singleton
├── store/game-store.ts           # Zustand client state
└── types/game.ts                 # All TypeScript types
prisma/
├── schema.prisma                 # Active schema (SQLite for dev)
├── schema.postgresql.prisma      # Production schema (swap for Vercel)
└── seed.ts                       # Local seed script
```

---

## 🎮 How to Play

1. **Create** a room (choose mode, settings) or **Join** with a 6-char code
2. Lobby — up to 12 players join, host configures settings
3. Host hits **Start Game** — roles & words secretly assigned server-side
4. **Discussion phase** — hint about your word without saying it directly
5. A random **twist** may change the rules mid-game
6. **Voting phase** — vote to eliminate who you think is the Impostor
7. **Reveal** — see all roles, secret word, earn XP & coins
8. Back to lobby for another round!

---

## 🔒 Security

- Secret roles, words, and twist data are **never sent to the client** until the reveal phase
- Server Actions validate the session on every mutation
- Passwords hashed with **bcrypt (12 rounds)**
- Chat rate-limited to 1 message per 500ms per user
- Input validated with **Zod** on all endpoints
- Security headers set on all responses

---

## 📄 License

MIT — free to use, modify, and deploy.
