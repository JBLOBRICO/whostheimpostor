import { PrismaClient } from "@prisma/client";
import { WORD_DATABASE } from "../src/lib/game-data/words";
import { ACHIEVEMENTS } from "../src/lib/game-data/achievements";
import { AVATARS, BORDERS, TITLES, EMOTES, VOTE_EFFECTS } from "../src/lib/game-data/cosmetics";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Seed word database
  console.log("  📝 Seeding words...");
  for (const word of WORD_DATABASE) {
    await db.wordDatabase.upsert({
      where: { word_category: { word: word.word, category: word.category } },
      create: {
        word: word.word,
        category: word.category,
        difficulty: word.difficulty,
      },
      update: {},
    });
  }

  // Seed achievements
  console.log("  🏆 Seeding achievements...");
  for (const ach of ACHIEVEMENTS) {
    await db.achievement.upsert({
      where: { key: ach.key },
      create: ach,
      update: ach,
    });
  }

  // Seed cosmetics
  console.log("  🎨 Seeding cosmetics...");
  const allCosmetics = [
    ...AVATARS.map((c) => ({ ...c, type: "avatar", description: `Avatar: ${c.name}` })),
    ...BORDERS.map((c) => ({ ...c, type: "border", description: `Border: ${c.name}` })),
    ...TITLES.map((c) => ({ ...c, type: "title", description: `Title: ${c.name}` })),
    ...EMOTES.map((c) => ({ ...c, type: "emote", description: `Emote: ${c.name}` })),
    ...VOTE_EFFECTS.map((c) => ({ ...c, type: "vote_effect", description: `Vote effect: ${c.name}` })),
  ];

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
      update: {
        name: c.name,
        coinCost: c.coinCost,
        levelRequired: c.levelRequired,
      },
    });
  }

  // Seed missions
  console.log("  🎯 Seeding missions...");
  const missions = [
    { key: "weekly_play_5", name: "On A Roll", description: "Play 5 games this week", type: "weekly", goalType: "games_played", goalAmount: 5, xpReward: 100, coinReward: 50 },
    { key: "weekly_win_3", name: "Winner's Circle", description: "Win 3 games this week", type: "weekly", goalType: "games_won", goalAmount: 3, xpReward: 150, coinReward: 75 },
    { key: "weekly_impostor_2", name: "Master of Disguise", description: "Win 2 games as Impostor this week", type: "weekly", goalType: "impostor_wins", goalAmount: 2, xpReward: 200, coinReward: 100 },
    { key: "weekly_guess_5", name: "Truth Seeker", description: "Correctly identify the Impostor 5 times", type: "weekly", goalType: "correct_guesses", goalAmount: 5, xpReward: 175, coinReward: 85 },
    { key: "daily_play_1", name: "Daily Duty", description: "Play at least 1 game today", type: "daily", goalType: "games_played", goalAmount: 1, xpReward: 30, coinReward: 15 },
    { key: "daily_win_1", name: "Daily Victory", description: "Win a game today", type: "daily", goalType: "games_won", goalAmount: 1, xpReward: 50, coinReward: 25 },
  ];

  for (const m of missions) {
    await db.mission.upsert({
      where: { key: m.key },
      create: m,
      update: m,
    });
  }

  // Seed daily event for today
  console.log("  🌟 Seeding daily event...");
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

  // Seed active ranked season
  console.log("  🏆 Seeding ranked season...");
  const activeSeason = await db.rankedSeason.findFirst({ where: { active: true } });
  if (!activeSeason) {
    await db.rankedSeason.create({
      data: {
        name: "Season 1: The Beginning",
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        active: true,
      },
    });
  }

  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
