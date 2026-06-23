"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayerAvatar } from "@/components/game/player-avatar";
import { XPBar } from "@/components/game/xp-bar";
import { updateProfile } from "@/lib/actions/profile";
import { useToast } from "@/hooks/use-toast";
import { AVATARS, BORDERS, TITLES, EMOTES, VOTE_EFFECTS } from "@/lib/game-data/cosmetics";
import { ArrowLeft, Edit2, Check, Gamepad2, Trophy, Target, Calendar } from "lucide-react";

interface ProfileProps {
  user: {
    id: string;
    displayName: string;
    username: string;
    level: number;
    xp: number;
    xpInLevel: number;
    xpForNext: number;
    coins: number;
    equippedAvatar: string;
    equippedBorder: string;
    equippedTitle: string;
    equippedEmote: string;
    equippedVoteEffect: string;
    totalGames: number;
    gamesWon: number;
    timesImpostor: number;
    impostorWins: number;
    correctGuesses: number;
    loginStreak: number;
    createdAt: string;
  };
  achievements: Array<{
    key: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    xpReward: number;
    coinReward: number;
    unlockedAt: string;
  }>;
  ownedCosmeticKeys: string[];
  missions: Array<{
    id: string;
    name: string;
    description: string;
    type: "daily" | "weekly" | "seasonal";
    goalAmount: number;
    xpReward: number;
    coinReward: number;
    progress: number;
    completed: boolean;
    expiresAt: string;
  }>;
}

type Tab = "overview" | "cosmetics" | "achievements" | "missions";

export function ProfileClient({ user, achievements, ownedCosmeticKeys, missions }: ProfileProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("overview");
  const [equipped, setEquipped] = useState({
    avatar: user.equippedAvatar,
    border: user.equippedBorder,
    title: user.equippedTitle,
    emote: user.equippedEmote,
    voteEffect: user.equippedVoteEffect,
  });
  const [saving, setSaving] = useState(false);

  async function handleEquip(type: keyof typeof equipped, key: string) {
    const newEquipped = { ...equipped, [type]: key };
    setEquipped(newEquipped);
    setSaving(true);
    try {
      await updateProfile({
        [`equipped${type.charAt(0).toUpperCase() + type.slice(1)}`]: key,
      });
      toast({ title: "Equipped!", description: "Changes saved.", variant: "success" });
    } catch {
      toast({ title: "Error", description: "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const winRate = user.totalGames > 0
    ? Math.round((user.gamesWon / user.totalGames) * 100)
    : 0;

  const TABS: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
    { id: "overview", label: "Overview", icon: <Gamepad2 className="w-4 h-4" /> },
    { id: "cosmetics", label: "Cosmetics", icon: <Edit2 className="w-4 h-4" /> },
    { id: "achievements", label: "Achievements", icon: <Trophy className="w-4 h-4" /> },
    { id: "missions", label: "Missions", icon: <Target className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass border-b border-white/10 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="font-bold text-white">Profile</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 mb-6"
        >
          <div className="flex items-start gap-6">
            <PlayerAvatar
              avatar={equipped.avatar}
              border={equipped.border}
              size="xl"
              level={user.level}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-white">{user.displayName}</h2>
                  <p className="text-white/40 text-sm">@{user.username}</p>
                  <Badge variant="purple" className="mt-1">{equipped.title}</Badge>
                </div>
                <div className="text-right">
                  <p className="text-yellow-400 font-bold">{user.coins.toLocaleString()} coins</p>
                  <p className="text-white/40 text-xs flex items-center justify-end gap-1 mt-1">
                    <Calendar className="w-3 h-3" />
                    {user.loginStreak} day streak
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <XPBar level={user.level} xpInLevel={user.xpInLevel} xpForNext={user.xpForNext} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 bg-white/5 rounded-xl">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.id
                  ? "bg-purple-600 text-white"
                  : "text-white/50 hover:text-white/70"
              }`}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "overview" && (
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { label: "Games Played", value: user.totalGames, icon: "🎮" },
              { label: "Win Rate", value: `${winRate}%`, icon: "🏆" },
              { label: "Games Won", value: user.gamesWon, icon: "⭐" },
              { label: "Times Impostor", value: user.timesImpostor, icon: "😈" },
              { label: "Impostor Wins", value: user.impostorWins, icon: "🎭" },
              { label: "Correct Guesses", value: user.correctGuesses, icon: "🔍" },
            ].map((stat) => (
              <Card key={stat.label} variant="glass" className="p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{stat.icon}</span>
                  <div>
                    <p className="text-white/50 text-xs">{stat.label}</p>
                    <p className="text-white font-bold text-xl">{stat.value}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {tab === "cosmetics" && (
          <div className="space-y-6">
            {[
              { title: "Avatars", type: "avatar" as const, items: AVATARS, current: equipped.avatar },
              { title: "Borders", type: "border" as const, items: BORDERS, current: equipped.border },
              { title: "Titles", type: "title" as const, items: TITLES, current: equipped.title },
              { title: "Emotes", type: "emote" as const, items: EMOTES, current: equipped.emote },
              { title: "Vote Effects", type: "voteEffect" as const, items: VOTE_EFFECTS, current: equipped.voteEffect },
            ].map((section) => (
              <div key={section.type}>
                <h3 className="font-bold text-white mb-3">{section.title}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {section.items.map((item) => {
                    const isOwned = item.coinCost === 0 || ownedCosmeticKeys.includes(item.key);
                    const isEquipped = section.current === item.key;
                    return (
                      <button
                        key={item.key}
                        disabled={!isOwned}
                        onClick={() => isOwned && handleEquip(section.type, item.key)}
                        className={`p-3 rounded-xl border transition-all text-center ${
                          isEquipped
                            ? "border-purple-500/60 bg-purple-500/20"
                            : isOwned
                            ? "border-white/10 bg-white/5 hover:bg-white/10"
                            : "border-white/5 bg-white/3 opacity-40 cursor-not-allowed"
                        }`}
                      >
                        <div className="text-2xl mb-1">{item.preview}</div>
                        <p className="text-white text-xs font-medium truncate">{item.name}</p>
                        {isEquipped && (
                          <div className="mt-1 flex justify-center">
                            <Badge variant="purple" className="text-[10px]">
                              <Check className="w-2.5 h-2.5 mr-1" />Equipped
                            </Badge>
                          </div>
                        )}
                        {!isOwned && (
                          <p className="text-yellow-400/60 text-[10px] mt-1">
                            🔒 {item.coinCost} coins
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "achievements" && (
          <div>
            <p className="text-white/50 text-sm mb-4">
              {achievements.length} achievements unlocked
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {achievements.map((ach, i) => (
                <motion.div
                  key={ach.key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card p-4 flex items-start gap-3"
                >
                  <span className="text-2xl">{ach.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm">{ach.name}</p>
                    <p className="text-white/50 text-xs">{ach.description}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-purple-400 text-xs">+{ach.xpReward} XP</span>
                      <span className="text-yellow-400 text-xs">+{ach.coinReward} coins</span>
                    </div>
                  </div>
                </motion.div>
              ))}
              {achievements.length === 0 && (
                <div className="col-span-2 text-center py-12 text-white/30">
                  No achievements yet. Start playing!
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "missions" && (
          <div className="space-y-3">
            {missions.map((mission) => {
              const pct = Math.min((mission.progress / mission.goalAmount) * 100, 100);
              return (
                <Card key={mission.id} variant="glass" className="p-4">
                  <CardContent className="p-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant={mission.type === "daily" ? "info" : mission.type === "weekly" ? "purple" : "warning"}
                            className="text-[10px]"
                          >
                            {mission.type}
                          </Badge>
                          <p className="font-bold text-white text-sm">{mission.name}</p>
                          {mission.completed && <Check className="w-4 h-4 text-green-400" />}
                        </div>
                        <p className="text-white/50 text-xs mb-2">{mission.description}</p>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                          />
                        </div>
                        <div className="flex justify-between mt-1">
                          <p className="text-white/40 text-xs">{mission.progress}/{mission.goalAmount}</p>
                          <div className="flex gap-2">
                            <span className="text-purple-400 text-xs">+{mission.xpReward} XP</span>
                            <span className="text-yellow-400 text-xs">+{mission.coinReward} coins</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {missions.length === 0 && (
              <div className="text-center py-12 text-white/30">
                No active missions. Check back soon!
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
