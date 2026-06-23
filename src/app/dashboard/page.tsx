import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      achievements: { include: { achievement: true }, take: 5, orderBy: { unlockedAt: "desc" } },
    },
  });

  if (!user) redirect("/login");

  // Get today's daily event
  const today = new Date().toISOString().slice(0, 10);
  const dailyEvent = await db.dailyEvent.findUnique({ where: { date: today } });

  return (
    <DashboardClient
      user={{
        id: user.id,
        displayName: user.displayName,
        username: user.username,
        level: user.level,
        xp: user.xp,
        coins: user.coins,
        equippedAvatar: user.equippedAvatar,
        equippedBorder: user.equippedBorder,
        equippedTitle: user.equippedTitle,
        totalGames: user.totalGames,
        gamesWon: user.gamesWon,
        timesImpostor: user.timesImpostor,
        impostorWins: user.impostorWins,
        loginStreak: user.loginStreak,
        lastDailyReward: user.lastDailyReward?.toISOString() ?? null,
      }}
      recentAchievements={user.achievements.map((ua) => ({
        key: ua.achievement.key,
        name: ua.achievement.name,
        icon: ua.achievement.icon,
        unlockedAt: ua.unlockedAt.toISOString(),
      }))}
      dailyEvent={dailyEvent ? {
        id: dailyEvent.id,
        date: dailyEvent.date,
        eventType: dailyEvent.eventType as "double_xp" | "double_coins" | "reverse_voting" | "mystery_words" | "fast_discussion" | "hidden_categories",
        name: dailyEvent.name,
        description: dailyEvent.description,
        multiplier: dailyEvent.multiplier,
      } : null}
    />
  );
}
