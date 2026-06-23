"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateRoomModal } from "@/components/room/create-room-modal";
import { JoinRoomModal } from "@/components/room/join-room-modal";
import { PlayerAvatar } from "@/components/game/player-avatar";
import { XPBar } from "@/components/game/xp-bar";
import { DailyEvent } from "@/types/game";
import { calculateXPForLevel } from "@/lib/utils";
import { claimDailyReward } from "@/lib/actions/profile";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "next-auth/react";
import {
  Trophy, Swords, Star, Coins, Gamepad2, Users, Plus,
  LogOut, User, BarChart3, Calendar, Zap, Crown
} from "lucide-react";

interface DashboardProps {
  user: {
    id: string;
    displayName: string;
    username: string;
    level: number;
    xp: number;
    coins: number;
    equippedAvatar: string;
    equippedBorder: string;
    equippedTitle: string;
    totalGames: number;
    gamesWon: number;
    timesImpostor: number;
    impostorWins: number;
    loginStreak: number;
    lastDailyReward: string | null;
  };
  recentAchievements: Array<{ key: string; name: string; icon: string; unlockedAt: string }>;
  dailyEvent: DailyEvent | null;
}

export function DashboardClient({ user, recentAchievements, dailyEvent }: DashboardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [claimingReward, setClaimingReward] = useState(false);

  const xpForNext = calculateXPForLevel(user.level);
  const xpInLevel = user.xp % xpForNext;
  const canClaimReward = !user.lastDailyReward ||
    (Date.now() - new Date(user.lastDailyReward).getTime()) > 20 * 60 * 60 * 1000;

  async function handleClaimReward() {
    if (!canClaimReward || claimingReward) return;
    setClaimingReward(true);
    try {
      const result = await claimDailyReward();
      if (result?.success) {
        toast({
          title: "🎁 Daily Reward Claimed!",
          description: `+${result.coins} coins, +${result.xp} XP • Streak: ${result.streak} days!`,
          variant: "success",
        });
        router.refresh();
      } else {
        toast({ title: "Already claimed today!", variant: "default" });
      }
    } finally {
      setClaimingReward(false);
    }
  }

  const winRate = user.totalGames > 0
    ? Math.round((user.gamesWon / user.totalGames) * 100)
    : 0;
  const impostorWinRate = user.timesImpostor > 0
    ? Math.round((user.impostorWins / user.timesImpostor) * 100)
    : 0;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🕵️</span>
            <span className="font-bold gradient-text hidden sm:block">Who&apos;s the Impostor</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/profile")}>
              <User className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => router.push("/shop")}>
              <Crown className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => signOut({ callbackUrl: "/" })}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Profile */}
          <div className="lg:col-span-1 space-y-4">
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card variant="glass" className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <PlayerAvatar
                    avatar={user.equippedAvatar}
                    border={user.equippedBorder}
                    size="lg"
                    level={user.level}
                  />
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-lg text-white truncate">{user.displayName}</h2>
                    <p className="text-white/40 text-sm">@{user.username}</p>
                    <Badge variant="purple" className="mt-1 text-xs">{user.equippedTitle}</Badge>
                  </div>
                </div>

                <XPBar
                  level={user.level}
                  xpInLevel={xpInLevel}
                  xpForNext={xpForNext}
                />

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-1.5 text-yellow-400">
                    <Coins className="w-4 h-4" />
                    <span className="font-bold">{user.coins.toLocaleString()}</span>
                  </div>
                  <div className="text-white/50 text-sm flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{user.loginStreak}d streak</span>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card variant="glass" className="p-6">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-400" />
                  Your Stats
                </h3>
                <div className="space-y-3">
                  {[
                    { label: "Games Played", value: user.totalGames, icon: "🎮" },
                    { label: "Win Rate", value: `${winRate}%`, icon: "🏆" },
                    { label: "Impostor Rate", value: `${impostorWinRate}%`, icon: "🎭" },
                    { label: "Games Won", value: user.gamesWon, icon: "⭐" },
                  ].map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between">
                      <span className="text-white/50 text-sm flex items-center gap-1.5">
                        <span>{stat.icon}</span> {stat.label}
                      </span>
                      <span className="font-bold text-white">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Daily Reward */}
            {canClaimReward && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Button
                  variant="gold"
                  className="w-full"
                  size="lg"
                  onClick={handleClaimReward}
                  loading={claimingReward}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Claim Daily Reward 🎁
                </Button>
              </motion.div>
            )}

            {/* Recent Achievements */}
            {recentAchievements.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card variant="glass" className="p-6">
                  <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    Recent Achievements
                  </h3>
                  <div className="space-y-2">
                    {recentAchievements.map((ach) => (
                      <div key={ach.key} className="flex items-center gap-2 text-sm">
                        <span className="text-lg">{ach.icon}</span>
                        <span className="text-white/70 truncate">{ach.name}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-3 text-white/50"
                    onClick={() => router.push("/profile?tab=achievements")}
                  >
                    View All
                  </Button>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Right: Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Daily Event Banner */}
            {dailyEvent && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="glass-card p-5 border-yellow-500/20 bg-yellow-500/5">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">🌟</div>
                    <div>
                      <p className="text-xs text-yellow-400/70 uppercase tracking-widest mb-0.5">Today&apos;s Event</p>
                      <h3 className="font-bold text-yellow-300">{dailyEvent.name}</h3>
                      <p className="text-white/60 text-sm">{dailyEvent.description}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Play Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Gamepad2 className="w-6 h-6 text-purple-400" />
                Play Now
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Card
                    variant="game"
                    className="p-6 cursor-pointer hover:border-purple-500/50 transition-all group"
                    onClick={() => setShowCreate(true)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                        <Plus className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-lg">Create Room</h3>
                        <p className="text-white/50 text-sm">Host a private game</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Card
                    variant="game"
                    className="p-6 cursor-pointer hover:border-cyan-500/50 transition-all group"
                    onClick={() => setShowJoin(true)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-500/30 transition-colors">
                        <Users className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-lg">Join Room</h3>
                        <p className="text-white/50 text-sm">Enter a room code</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </div>
            </motion.div>

            {/* Game Modes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Swords className="w-5 h-5 text-pink-400" />
                Game Modes
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  {
                    mode: "classic", name: "Classic Mode", desc: "Standard gameplay — find the Impostor!",
                    icon: "🎭", color: "from-purple-500/20 to-purple-500/5", border: "border-purple-500/20"
                  },
                  {
                    mode: "chaos", name: "Chaos Mode", desc: "Random twists every single round!",
                    icon: "🌪️", color: "from-orange-500/20 to-orange-500/5", border: "border-orange-500/20"
                  },
                  {
                    mode: "ranked", name: "Ranked Mode", desc: "Compete for your spot on the leaderboard",
                    icon: "🏆", color: "from-yellow-500/20 to-yellow-500/5", border: "border-yellow-500/20"
                  },
                  {
                    mode: "custom", name: "Custom Mode", desc: "Configure every setting your way",
                    icon: "⚙️", color: "from-blue-500/20 to-blue-500/5", border: "border-blue-500/20"
                  },
                ].map((m) => (
                  <div
                    key={m.mode}
                    className={`glass-card p-4 bg-gradient-to-br ${m.color} ${m.border} cursor-pointer hover:scale-[1.02] transition-all`}
                    onClick={() => setShowCreate(true)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{m.icon}</span>
                      <div>
                        <p className="font-semibold text-white text-sm">{m.name}</p>
                        <p className="text-white/50 text-xs">{m.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-3 gap-3"
            >
              {[
                { label: "Profile", icon: <User className="w-5 h-5" />, path: "/profile", color: "text-purple-400" },
                { label: "Shop", icon: <Crown className="w-5 h-5" />, path: "/shop", color: "text-yellow-400" },
                { label: "Leaderboard", icon: <Star className="w-5 h-5" />, path: "/leaderboard", color: "text-pink-400" },
              ].map((action) => (
                <Card
                  key={action.label}
                  variant="glass"
                  className="p-4 cursor-pointer hover:bg-white/10 transition-all text-center"
                  onClick={() => router.push(action.path)}
                >
                  <div className={`mx-auto mb-2 ${action.color}`}>{action.icon}</div>
                  <p className="text-white/70 text-sm font-medium">{action.label}</p>
                </Card>
              ))}
            </motion.div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <CreateRoomModal open={showCreate} onClose={() => setShowCreate(false)} />
      <JoinRoomModal open={showJoin} onClose={() => setShowJoin(false)} />
    </div>
  );
}
