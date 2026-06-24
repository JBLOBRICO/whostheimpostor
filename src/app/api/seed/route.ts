import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { WORD_DATABASE } from "@/lib/game-data/words";
import { ACHIEVEMENTS } from "@/lib/game-data/achievements";
import { AVATARS, BORDERS, TITLES, EMOTES, VOTE_EFFECTS } from "@/lib/game-data/cosmetics";

// One-time seed endpoint — protected by a secret token
// Call: POST /api/seed with header Authorization: Bearer <SEED_SECRET>
// Set SEED_SECRET in Vercel env vars (any random string)

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = process.env.SEED_SECRET;

  // In production, require a seed secret. In dev, allow freely.
  if (process.env.NODE_ENV === "production") {
    if (!secret || auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

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
        create: { key: c.key, name: c.name, description: c.description, type: c.type, rarity: c.rarity, coinCost: c.coinCost, levelRequired: c.levelRequired, preview: c.preview },
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
      create: { date: today, eventType: "double_xp", name: "Double XP Day! ⚡", description: "Earn 2x XP from all matches today!", multiplier: 2.0, active: true },
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
      seeded: { words: wordCount, achievements: achCount, cosmetics: cosmeticCount, missions: missions.length },
    });
  } catch (err) {
    console.error("Seed error:", err);
    return NextResponse.json({ error: "Seed failed", detail: String(err) }, { status: 500 });
  }
}
