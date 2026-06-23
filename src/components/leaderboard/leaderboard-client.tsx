"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlayerAvatar } from "@/components/game/player-avatar";
import { ArrowLeft, Trophy, Star, Swords } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeaderboardPlayer {
  id: string;
  displayName: string;
  username: string;
  level: number;
  xp: number;
  gamesWon: number;
  totalGames: number;
  timesImpostor: number;
  impostorWins: number;
  equippedAvatar: string;
  equippedBorder: string;
  equippedTitle: string;
  winRate: number;
  impostorWinRate: number;
}

type SortKey = "wins" | "level" | "winRate" | "impostorWins";

const RANK_ICONS = ["🥇", "🥈", "🥉"];

export function LeaderboardClient({
  currentUserId,
  players,
}: {
  currentUserId: string;
  players: LeaderboardPlayer[];
}) {
  const router = useRouter();
  const [sort, setSort] = useState<SortKey>("wins");

  const sorted = [...players].sort((a, b) => {
    switch (sort) {
      case "wins": return b.gamesWon - a.gamesWon;
      case "level": return b.level - a.level;
      case "winRate": return b.winRate - a.winRate;
      case "impostorWins": return b.impostorWins - a.impostorWins;
    }
  });

  const myRank = sorted.findIndex((p) => p.id === currentUserId) + 1;

  return (
    <div className="min-h-screen">
      <header className="glass border-b border-white/10 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Leaderboard
          </h1>
          {myRank > 0 && (
            <Badge variant="purple" className="ml-auto">
              Your Rank: #{myRank}
            </Badge>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Sort tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {([
            { key: "wins" as SortKey, label: "Most Wins", icon: <Trophy className="w-3.5 h-3.5" /> },
            { key: "level" as SortKey, label: "Highest Level", icon: <Star className="w-3.5 h-3.5" /> },
            { key: "winRate" as SortKey, label: "Best Win Rate", icon: <Star className="w-3.5 h-3.5" /> },
            { key: "impostorWins" as SortKey, label: "Impostor Wins", icon: <Swords className="w-3.5 h-3.5" /> },
          ]).map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                sort === s.key
                  ? "bg-purple-600 text-white"
                  : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70"
              )}
            >
              {s.icon}
              {s.label}
            </button>
          ))}
        </div>

        {/* Top 3 */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {sorted.slice(0, 3).map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "glass-card p-4 text-center",
                i === 0 && "border-yellow-500/40 bg-yellow-500/5",
                i === 1 && "border-gray-400/30 bg-gray-400/5",
                i === 2 && "border-orange-600/30 bg-orange-600/5",
                p.id === currentUserId && "ring-2 ring-purple-500/50"
              )}
              style={{ marginTop: i === 0 ? 0 : i === 1 ? "8px" : "16px" }}
            >
              <div className="text-2xl mb-2">{RANK_ICONS[i]}</div>
              <PlayerAvatar
                avatar={p.equippedAvatar}
                border={p.equippedBorder}
                size="md"
                level={p.level}
                className="mx-auto mb-2"
              />
              <p className="font-bold text-white text-sm truncate">{p.displayName}</p>
              <p className="text-white/40 text-xs">{p.equippedTitle}</p>
              <p className="mt-2 font-bold text-lg text-white">
                {sort === "wins" ? p.gamesWon :
                 sort === "level" ? `Lv.${p.level}` :
                 sort === "winRate" ? `${p.winRate}%` :
                 p.impostorWins}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Full list */}
        <div className="space-y-2">
          {sorted.slice(3).map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (i + 3) * 0.04 }}
              className={cn(
                "glass-card p-4 flex items-center gap-4",
                p.id === currentUserId && "border-purple-500/40 bg-purple-500/5"
              )}
            >
              <span className="text-white/40 font-bold w-6 text-center text-sm">
                #{i + 4}
              </span>
              <PlayerAvatar
                avatar={p.equippedAvatar}
                border={p.equippedBorder}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm truncate">{p.displayName}</p>
                <p className="text-white/40 text-xs">{p.equippedTitle} · Lv.{p.level}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-white">
                  {sort === "wins" ? `${p.gamesWon} W` :
                   sort === "level" ? `Lv.${p.level}` :
                   sort === "winRate" ? `${p.winRate}%` :
                   `${p.impostorWins} W`}
                </p>
                <p className="text-white/40 text-xs">{p.totalGames} games</p>
              </div>
            </motion.div>
          ))}
        </div>

        {players.length === 0 && (
          <div className="text-center py-16 text-white/30">
            No players yet. Be the first to play!
          </div>
        )}
      </main>
    </div>
  );
}
