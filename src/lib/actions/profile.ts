"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { AVATARS, BORDERS, TITLES, EMOTES, VOTE_EFFECTS } from "@/lib/game-data/cosmetics";

const ALL_COSMETICS = [
  ...AVATARS.map((c) => ({ ...c, type: "avatar" })),
  ...BORDERS.map((c) => ({ ...c, type: "border" })),
  ...TITLES.map((c) => ({ ...c, type: "title" })),
  ...EMOTES.map((c) => ({ ...c, type: "emote" })),
  ...VOTE_EFFECTS.map((c) => ({ ...c, type: "vote_effect" })),
];

// FIX: validate equipped keys are real cosmetic keys
const VALID_COSMETIC_KEYS = new Set(ALL_COSMETICS.map((c) => c.key));

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

  // FIX: verify user owns any cosmetic being equipped
  const cosmeticsToCheck: Array<{ key: string; type: string }> = [];
  if (parsed.data.equippedAvatar) cosmeticsToCheck.push({ key: parsed.data.equippedAvatar, type: "avatar" });
  if (parsed.data.equippedBorder) cosmeticsToCheck.push({ key: parsed.data.equippedBorder, type: "border" });
  if (parsed.data.equippedTitle) cosmeticsToCheck.push({ key: parsed.data.equippedTitle, type: "title" });
  if (parsed.data.equippedEmote) cosmeticsToCheck.push({ key: parsed.data.equippedEmote, type: "emote" });
  if (parsed.data.equippedVoteEffect) cosmeticsToCheck.push({ key: parsed.data.equippedVoteEffect, type: "vote_effect" });

  for (const { key, type } of cosmeticsToCheck) {
    if (!VALID_COSMETIC_KEYS.has(key)) {
      return { error: `Invalid cosmetic: ${key}` };
    }
    const cosmeticDef = ALL_COSMETICS.find((c) => c.key === key && c.type === type);
    if (!cosmeticDef) continue;

    // Free cosmetics (coinCost === 0) are always owned
    if (cosmeticDef.coinCost > 0) {
      const cosmetic = await db.cosmetic.findUnique({ where: { key } });
      if (cosmetic) {
        const owned = await db.userCosmetic.findFirst({
          where: { userId: session.user.id, cosmeticId: cosmetic.id },
        });
        if (!owned) return { error: `You don't own "${cosmeticDef.name}"` };
      }
    }
  }

  try {
    await db.user.update({ where: { id: session.user.id }, data: parsed.data });
    return { success: true };
  } catch {
    return { error: "Failed to update profile" };
  }
}

export async function purchaseCosmetic(cosmeticKey: string, cosmeticType: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const cosmeticDef = ALL_COSMETICS.find(
    (c) => c.key === cosmeticKey && c.type === cosmeticType
  );
  if (!cosmeticDef) return { error: "Cosmetic not found" };
  if (cosmeticDef.coinCost === 0) return { error: "This item is free — equip it from your profile!" };

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { error: "User not found" };
  if (user.level < cosmeticDef.levelRequired) {
    return { error: `Requires level ${cosmeticDef.levelRequired}` };
  }
  if (user.coins < cosmeticDef.coinCost) {
    return { error: `Not enough coins (need ${cosmeticDef.coinCost}, have ${user.coins})` };
  }

  // Ensure cosmetic exists in DB
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

  // FIX: use transaction with idempotent create to prevent double-spend race
  try {
    await db.$transaction(async (tx) => {
      // Check ownership inside transaction
      const alreadyOwned = await tx.userCosmetic.findUnique({
        where: { userId_cosmeticId: { userId: session.user.id, cosmeticId: cosmetic!.id } },
      });
      if (alreadyOwned) throw new Error("ALREADY_OWNED");

      // Re-check coins inside transaction
      const freshUser = await tx.user.findUnique({
        where: { id: session.user.id },
        select: { coins: true },
      });
      if (!freshUser || freshUser.coins < cosmeticDef.coinCost) {
        throw new Error("INSUFFICIENT_COINS");
      }

      await tx.userCosmetic.create({
        data: { userId: session.user.id, cosmeticId: cosmetic!.id },
      });
      await tx.user.update({
        where: { id: session.user.id },
        data: { coins: { decrement: cosmeticDef.coinCost } },
      });
    });

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === "ALREADY_OWNED") return { error: "Already owned" };
    if (msg === "INSUFFICIENT_COINS") return { error: "Not enough coins" };
    console.error("Purchase error:", err);
    return { error: "Purchase failed. Please try again." };
  }
}

export async function claimDailyReward() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { error: "User not found" };

  const now = new Date();
  if (user.lastDailyReward) {
    const hoursSince = (now.getTime() - user.lastDailyReward.getTime()) / (1000 * 60 * 60);
    if (hoursSince < 20) return { error: "Daily reward already claimed" };
  }

  const isConsecutive = user.lastDailyReward
    ? (now.getTime() - user.lastDailyReward.getTime()) < 48 * 60 * 60 * 1000
    : false;

  const newStreak = isConsecutive ? user.loginStreak + 1 : 1;
  const bonusMultiplier = Math.min(1 + newStreak * 0.1, 3);
  const coins = Math.floor(25 * bonusMultiplier);
  const xp = Math.floor(15 * bonusMultiplier);

  await db.user.update({
    where: { id: session.user.id },
    data: { lastDailyReward: now, loginStreak: newStreak, coins: { increment: coins }, xp: { increment: xp } },
  });

  return { success: true, coins, xp, streak: newStreak };
}

export async function getProfileData(userId?: string) {
  const session = await auth();
  const targetId = userId ?? session?.user?.id;
  if (!targetId) return null;

  return db.user.findUnique({
    where: { id: targetId },
    include: {
      achievements: { include: { achievement: true } },
      ownedCosmetics: { include: { cosmetic: true } },
      weeklyMissions: { include: { mission: true } },
    },
  });
}
