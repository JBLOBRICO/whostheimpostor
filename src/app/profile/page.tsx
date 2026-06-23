import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ProfileClient } from "@/components/profile/profile-client";
import { calculateXPForLevel } from "@/lib/utils";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      achievements: {
        include: { achievement: true },
        orderBy: { unlockedAt: "desc" },
      },
      ownedCosmetics: {
        include: { cosmetic: true },
      },
      weeklyMissions: {
        include: { mission: true },
        where: {
          expiresAt: { gt: new Date() },
        },
      },
    },
  });

  if (!user) redirect("/login");

  const xpForNext = calculateXPForLevel(user.level);
  const xpInLevel = user.xp % xpForNext;

  return (
    <ProfileClient
      user={{
        id: user.id,
        displayName: user.displayName,
        username: user.username,
        level: user.level,
        xp: user.xp,
        xpInLevel,
        xpForNext,
        coins: user.coins,
        equippedAvatar: user.equippedAvatar,
        equippedBorder: user.equippedBorder,
        equippedTitle: user.equippedTitle,
        equippedEmote: user.equippedEmote,
        equippedVoteEffect: user.equippedVoteEffect,
        totalGames: user.totalGames,
        gamesWon: user.gamesWon,
        timesImpostor: user.timesImpostor,
        impostorWins: user.impostorWins,
        correctGuesses: user.correctGuesses,
        loginStreak: user.loginStreak,
        createdAt: user.createdAt.toISOString(),
      }}
      achievements={user.achievements.map((ua) => ({
        key: ua.achievement.key,
        name: ua.achievement.name,
        description: ua.achievement.description,
        icon: ua.achievement.icon,
        category: ua.achievement.category,
        xpReward: ua.achievement.xpReward,
        coinReward: ua.achievement.coinReward,
        unlockedAt: ua.unlockedAt.toISOString(),
      }))}
      ownedCosmeticKeys={user.ownedCosmetics.map((oc) => oc.cosmetic.key)}
      missions={user.weeklyMissions.map((um) => ({
        id: um.id,
        name: um.mission.name,
        description: um.mission.description,
        type: um.mission.type as "daily" | "weekly" | "seasonal",
        goalAmount: um.mission.goalAmount,
        xpReward: um.mission.xpReward,
        coinReward: um.mission.coinReward,
        progress: um.progress,
        completed: um.completed,
        expiresAt: um.expiresAt.toISOString(),
      }))}
    />
  );
}
