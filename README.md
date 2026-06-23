# Who's the Impostor: Twist Edition 🕵️

A modern, full-stack multiplayer social deduction party game built with **Next.js 15**, featuring 15 unique gameplay twists, special ability cards, ranked modes, and a rich cosmetic progression system — all deployable on **Vercel** with zero dedicated servers.

## ✨ Features

- 🎭 **Social Deduction Gameplay** — 4–12 players, one Impostor, find them before it's too late
- 🌪️ **15 Unique Twists** — Reverse Round, Double Agent, Silent Round, Fake Hint, Memory Loss, and more
- ⚡ **Special Ability Cards** — 11 strategic single-use powers per game
- 🏆 **4 Game Modes** — Classic, Chaos, Ranked (Bronze→Master), Custom
- 🎨 **Rich Cosmetics** — Avatars, borders, titles, emotes, vote effects — all unlockable with in-game coins
- 📅 **Daily Events** — Global modifiers that rotate every day (Double XP, Fast Discussion, etc.)
- 🎯 **Missions & Achievements** — Weekly missions, daily quests, 30+ achievements
- 💰 **Progression System** — XP, levels, coins, login streaks
- 🌐 **No Download** — Runs entirely in the browser

## 🛠 Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + Framer Motion |
| Auth | NextAuth v5 (JWT) |
| Database | Prisma ORM + SQLite (dev) / Vercel Postgres (prod) |
| State | Zustand |
| Multiplayer | Optimistic polling via Route Handlers |
| Deployment | Vercel |

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/JBLOBRICO/whostheimpostor.git
cd whostheimpostor
npm install
```

### 2. Set up environment
```bash
cp .env.example .env
# Edit .env with your NEXTAUTH_SECRET (any random 32+ char string)
```

### 3. Set up the database
```bash
npm run db:push      # Create SQLite schema
npm run db:seed      # Seed words, achievements, cosmetics
```

### 4. Run the dev server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

## 🌐 Deploy to Vercel

1. Push this repo to GitHub
2. Import into [Vercel](https://vercel.com)
3. Add environment variables:
   - `NEXTAUTH_SECRET` — a secure random string
   - `NEXTAUTH_URL` — your production URL
   - `DATABASE_URL` — Vercel Postgres connection string (switch `schema.prisma` provider to `postgresql`)
4. Deploy!

### Switching to Vercel Postgres
In `prisma/schema.prisma`, change:
```prisma
datasource db {
  provider = "postgresql"   // ← change from "sqlite"
  url      = env("DATABASE_URL")
}
```

## 🎮 How to Play

1. **Create** a room or **Join** with a 6-character code
2. Wait for 4–12 players in the lobby
3. Host starts the game — roles & words are secretly assigned
4. **Discussion phase** — talk, hint, accuse (subject to the active twist!)
5. **Voting phase** — vote to eliminate who you think is the Impostor
6. **Reveal** — see who was right, earn XP & coins, climb the ranks

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages + API routes
│   ├── api/                # Route Handlers (polling, messages, events)
│   ├── dashboard/          # Main menu
│   ├── room/[code]/        # Game room
│   ├── profile/            # Player profile & cosmetics
│   ├── shop/               # Cosmetic shop
│   └── leaderboard/        # Global rankings
├── components/
│   ├── auth/               # Login & register forms
│   ├── dashboard/          # Dashboard UI
│   ├── game/               # All in-game components
│   ├── room/               # Room lobby & game shell
│   ├── shop/               # Shop UI
│   ├── profile/            # Profile UI
│   ├── leaderboard/        # Leaderboard UI
│   └── ui/                 # Reusable UI primitives
├── lib/
│   ├── actions/            # Server Actions (auth, room, game, profile)
│   ├── game-data/          # Words, twists, abilities, cosmetics, achievements
│   ├── auth.ts             # NextAuth config
│   ├── db.ts               # Prisma client
│   ├── game-engine.ts      # Core game logic (server-side only)
│   └── utils.ts            # Helpers
├── store/
│   └── game-store.ts       # Zustand global state
└── types/
    └── game.ts             # All TypeScript types
```

## 🔒 Security

- All secret game data (roles, words, twists) is **server-side only** until reveal phase
- Server Actions validate session on every mutation
- Rate limiting on chat messages
- Input validation with Zod on all endpoints
- Passwords hashed with bcrypt (12 rounds)

## 📄 License

MIT
