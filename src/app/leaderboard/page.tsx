import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { LeaderboardClient } from "@/components/leaderboard/leaderboard-client";

export default async function LeaderboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const topPlayers = await db.user.findMany({
    orderBy: [{ gamesWon: "desc" }, { level: "desc" }],
    take: 50,
    select: {
      id: true,
      displayName: true,
      username: true,
      level: true,
      xp: true,
      gamesWon: true,
      totalGames: true,
      timesImpostor: true,
      impostorWins: true,
      equippedAvatar: true,
      equippedBorder: true,
      equippedTitle: true,
    },
  });

  return (
    <LeaderboardClient
      currentUserId={session.user.id}
      players={topPlayers.map((p) => ({
        ...p,
        winRate: p.totalGames > 0 ? Math.round((p.gamesWon / p.totalGames) * 100) : 0,
        impostorWinRate: p.timesImpostor > 0 ? Math.round((p.impostorWins / p.timesImpostor) * 100) : 0,
      }))}
    />
  );
}
