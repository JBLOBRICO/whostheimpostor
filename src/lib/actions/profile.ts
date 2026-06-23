"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { AVATARS, BORDERS, TITLES, EMOTES, VOTE_EFFECTS } from "@/lib/game-data/cosmetics";

export async function updateProfile(data: {
  displayName?: string;
  equippedAvatar?: string;
  equippedBorder?: string;
  equippedTitle?: string;
  equippedEmote?: string;
  equippedVoteEffect?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const schema = z.object({
    displayName: z.string().min(2).max(20).optional(),
    equippedAvatar: z.string().optional(),
    equippedBorder: z.string().optional(),
    equippedTitle: z.string().optional(),
    equippedEmote: z.string().optional(),
    equippedVoteEffect: z.string().optional(),
  });

  const parsed = schema.safeParse(data);
  if (!parsed.success) return { error: "Invalid data" };

  try {
    await db.user.update({
      where: { id: session.user.id },
      data: parsed.data,
    });
    return { success: true };
  } catch {
    return { error: "Failed to update profile" };
  }
}

export async function purchaseCosmetic(cosmeticKey: string, cosmeticType: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  // Find cosmetic definition
  const allCosmetics = [
    ...AVATARS.map((c) => ({ ...c, type: "avatar" })),
    ...BORDERS.map((c) => ({ ...c, type: "border" })),
    ...TITLES.map((c) => ({ ...c, type: "title" })),
    ...EMOTES.map((c) => ({ ...c, type: "emote" })),
    ...VOTE_EFFECTS.map((c) => ({ ...c, type: "vote_effect" })),
  ];

  const cosmeticDef = allCosmetics.find(
    (c) => c.key === cosmeticKey && c.type === cosmeticType
  );

  if (!cosmeticDef) return { error: "Cosmetic not found" };

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { error: "User not found" };

  if (user.level < cosmeticDef.levelRequired) {
    return { error: `Requires level ${cosmeticDef.levelRequired}` };
  }

  if (user.coins < cosmeticDef.coinCost) {
    return { error: "Not enough coins" };
  }

  // Find or create cosmetic in DB
  let cosmetic = await db.cosmetic.findUnique({ where: { key: cosmeticKey } });
  if (!cosmetic) {
    cosmetic = await db.cosmetic.create({
      data: {
        key: cosmeticDef.key,
        name: cosmeticDef.name,
        type: cosmeticDef.type,
        rarity: cosmeticDef.rarity,
        coinCost: cosmeticDef.coinCost,
        levelRequired: cosmeticDef.levelRequired,
        preview: cosmeticDef.preview,
      },
    });
  }

  // Check if already owned
  const owned = await db.userCosmetic.findUnique({
    where: { userId_cosmeticId: { userId: session.user.id, cosmeticId: cosmetic.id } },
  });
  if (owned) return { error: "Already owned" };

  try {
    await db.$transaction([
      db.userCosmetic.create({
        data: { userId: session.user.id, cosmeticId: cosmetic.id },
      }),
      db.user.update({
        where: { id: session.user.id },
        data: { coins: { decrement: cosmeticDef.coinCost } },
      }),
    ]);

    return { success: true };
  } catch {
    return { error: "Purchase failed" };
  }
}

export async function claimDailyReward() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { error: "User not found" };

  const now = new Date();
  const lastReward = user.lastDailyReward;

  if (lastReward) {
    const hoursSince = (now.getTime() - lastReward.getTime()) / (1000 * 60 * 60);
    if (hoursSince < 20) {
      return { error: "Daily reward already claimed" };
    }
  }

  // Check streak
  const isConsecutive = lastReward
    ? (now.getTime() - lastReward.getTime()) / (1000 * 60 * 60) < 48
    : false;

  const newStreak = isConsecutive ? user.loginStreak + 1 : 1;
  const bonusMultiplier = Math.min(1 + newStreak * 0.1, 3);
  const baseCoins = 25;
  const baseXP = 15;
  const coins = Math.floor(baseCoins * bonusMultiplier);
  const xp = Math.floor(baseXP * bonusMultiplier);

  await db.user.update({
    where: { id: session.user.id },
    data: {
      lastDailyReward: now,
      loginStreak: newStreak,
      coins: { increment: coins },
      xp: { increment: xp },
    },
  });

  return { success: true, coins, xp, streak: newStreak };
}

export async function getProfileData(userId?: string) {
  const session = await auth();
  const targetId = userId ?? session?.user?.id;
  if (!targetId) return null;

  const user = await db.user.findUnique({
    where: { id: targetId },
    include: {
      achievements: { include: { achievement: true } },
      ownedCosmetics: { include: { cosmetic: true } },
      weeklyMissions: { include: { mission: true } },
    },
  });

  return user;
}
