import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { WORD_DATABASE } from "@/lib/game-data/words";
import { ACHIEVEMENTS } from "@/lib/game-data/achievements";
import { AVATARS, BORDERS, TITLES, EMOTES, VOTE_EFFECTS } from "@/lib/game-data/cosmetics";

// Seed endpoint — two ways to call:
// 1. Browser (GET): https://your-app.vercel.app/api/seed?secret=YOUR_SEED_SECRET
// 2. curl (POST):   curl -X POST https://your-app.vercel.app/api/seed -H "Authorization: Bearer YOUR_SEED_SECRET"
// If SEED_SECRET env var is not set, the endpoint runs freely (set it for security).

async function runSeed() {
  try {
    // Words
    let wordCount = 0;
    for (const word of WORD_DATABASE) {
      await db.wordDatabase.upsert({
        where: { word_category: { word: word.word, category: word.category } },
        create: { word: word.word, category: word.category, difficulty: word.difficulty },
        update: {},
      });
      wordCount++;
    }

    // Achievements
    let achCount = 0;
    for (const ach of ACHIEVEMENTS) {
      await db.achievement.upsert({
        where: { key: ach.key },
        create: ach,
        update: ach,
      });
      achCount++;
    }

    // Cosmetics
    const allCosmetics = [
      ...AVATARS.map((c) => ({ ...c, type: "avatar", description: `Avatar: ${c.name}` })),
      ...BORDERS.map((c) => ({ ...c, type: "border", description: `Border: ${c.name}` })),
      ...TITLES.map((c) => ({ ...c, type: "title", description: `Title: ${c.name}` })),
      ...EMOTES.map((c) => ({ ...c, type: "emote", description: `Emote: ${c.name}` })),
      ...VOTE_EFFECTS.map((c) => ({ ...c, type: "vote_effect", description: `Vote effect: ${c.name}` })),
    ];
    let cosmeticCount = 0;
    for (const c of allCosmetics) {
      await db.cosmetic.upsert({
        where: { key: c.key },
        create: {
          key: c.key,
          name: c.name,
          description: c.description,
          type: c.type,
          rarity: c.rarity,
          coinCost: c.coinCost,
          levelRequired: c.levelRequired,
          preview: c.preview,
        },
        update: { name: c.name, coinCost: c.coinCost, levelRequired: c.levelRequired },
      });
      cosmeticCount++;
    }

    // Missions
    const missions = [
      { key: "weekly_play_5", name: "On A Roll", description: "Play 5 games this week", type: "weekly", goalType: "games_played", goalAmount: 5, xpReward: 100, coinReward: 50 },
      { key: "weekly_win_3", name: "Winner's Circle", description: "Win 3 games this week", type: "weekly", goalType: "games_won", goalAmount: 3, xpReward: 150, coinReward: 75 },
      { key: "weekly_impostor_2", name: "Master of Disguise", description: "Win 2 games as Impostor this week", type: "weekly", goalType: "impostor_wins", goalAmount: 2, xpReward: 200, coinReward: 100 },
      { key: "weekly_guess_5", name: "Truth Seeker", description: "Correctly identify the Impostor 5 times", type: "weekly", goalType: "correct_guesses", goalAmount: 5, xpReward: 175, coinReward: 85 },
      { key: "daily_play_1", name: "Daily Duty", description: "Play at least 1 game today", type: "daily", goalType: "games_played", goalAmount: 1, xpReward: 30, coinReward: 15 },
      { key: "daily_win_1", name: "Daily Victory", description: "Win a game today", type: "daily", goalType: "games_won", goalAmount: 1, xpReward: 50, coinReward: 25 },
    ];
    for (const m of missions) {
      await db.mission.upsert({ where: { key: m.key }, create: m, update: m });
    }

    // Daily event for today
    const today = new Date().toISOString().slice(0, 10);
    await db.dailyEvent.upsert({
      where: { date: today },
      create: {
        date: today,
        eventType: "double_xp",
        name: "Double XP Day! ⚡",
        description: "Earn 2x XP from all matches today!",
        multiplier: 2.0,
        active: true,
      },
      update: {},
    });

    // Ranked season
    const activeSeason = await db.rankedSeason.findFirst({ where: { active: true } });
    if (!activeSeason) {
      await db.rankedSeason.create({
        data: {
          name: "Season 1: The Beginning",
          startDate: new Date(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          active: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully!",
      seeded: {
        words: wordCount,
        achievements: achCount,
        cosmetics: cosmeticCount,
        missions: missions.length,
      },
    });
  } catch (err) {
    console.error("Seed error:", err);
    return NextResponse.json({ error: "Seed failed", detail: String(err) }, { status: 500 });
  }
}

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.SEED_SECRET;
  if (!secret) return true; // No secret set = open (set SEED_SECRET in Vercel for security)

  const authHeader = req.headers.get("authorization");
  const querySecret = req.nextUrl.searchParams.get("secret");

  return authHeader === `Bearer ${secret}` || querySecret === secret;
}

// GET: open in browser → https://whostheimpostor.vercel.app/api/seed?secret=YOUR_SECRET
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized. Add ?secret=YOUR_SEED_SECRET to the URL." }, { status: 401 });
  }
  return runSeed();
}

// POST: curl -X POST https://whostheimpostor.vercel.app/api/seed -H "Authorization: Bearer YOUR_SECRET"
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return runSeed();
}
