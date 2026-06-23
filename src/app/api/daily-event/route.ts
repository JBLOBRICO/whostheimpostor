import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const EVENT_TYPES = [
  {
    eventType: "double_xp",
    name: "Double XP Day! ⚡",
    description: "Earn 2x XP from all matches today!",
    multiplier: 2.0,
  },
  {
    eventType: "double_coins",
    name: "Coin Rush! 💰",
    description: "All matches reward double coins today!",
    multiplier: 2.0,
  },
  {
    eventType: "fast_discussion",
    name: "Speed Round! ⏱️",
    description: "All discussions are 50% shorter today!",
    multiplier: 0.5,
  },
  {
    eventType: "mystery_words",
    name: "Mystery Day! 🎲",
    description: "Every word is from a surprise category today!",
    multiplier: 1.5,
  },
  {
    eventType: "hidden_categories",
    name: "Blind Hunt! 👁️",
    description: "Categories are hidden for all players today!",
    multiplier: 1.25,
  },
  {
    eventType: "reverse_voting",
    name: "Opposite Day! 🔄",
    description: "Votes go in reverse order today!",
    multiplier: 1.0,
  },
];

export async function GET() {
  try {
    const today = new Date().toISOString().slice(0, 10);

    let event = await db.dailyEvent.findUnique({ where: { date: today } });

    if (!event) {
      // Generate today's event based on date seed
      const dateSeed = today.split("-").join("").slice(-3);
      const idx = parseInt(dateSeed) % EVENT_TYPES.length;
      const eventDef = EVENT_TYPES[idx];

      event = await db.dailyEvent.create({
        data: {
          date: today,
          ...eventDef,
          active: true,
        },
      });
    }

    return NextResponse.json({ event });
  } catch {
    return NextResponse.json({ error: "Failed to get daily event" }, { status: 500 });
  }
}
