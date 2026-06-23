"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RoomState } from "@/types/game";
import { Button } from "@/components/ui/button";
import { PlayerAvatar } from "@/components/game/player-avatar";
import { Badge } from "@/components/ui/badge";
import { finishGame } from "@/lib/actions/game";
import { useToast } from "@/hooks/use-toast";
import { ALL_ABILITIES } from "@/lib/game-data/abilities";
import { Trophy, Star, Coins, ArrowRight, RotateCcw } from "lucide-react";

interface GameRevealProps {
  roomState: RoomState;
  currentUserId: string;
  roomId: string;
}

const STAT_LABELS: Record<string, { icon: string; label: string }> = {
  mostSuspicious: { icon: "🤔", label: "Most Suspicious" },
  biggestLiar: { icon: "🤥", label: "Biggest Liar" },
  detective: { icon: "🔍", label: "Detective Award" },
  masterDeceiver: { icon: "🎭", label: "Master Deceiver" },
  fastestVote: { icon: "⚡", label: "Fastest Vote" },
  silentPlayer: { icon: "🤫", label: "Silent Player" },
  mostTrusted: { icon: "🤝", label: "Most Trusted" },
  chaosCreator: { icon: "🌪️", label: "Chaos Creator" },
};

export function GameReveal({ roomState, currentUserId, roomId }: GameRevealProps) {
  const { toast } = useToast();
  const [finishing, setFinishing] = useState(false);
  const isHost = roomState.hostId === currentUserId;
  const game = roomState.currentGame;
  const reveal = game?.revealData;

  if (!reveal) return null;

  const myPlayer = reveal.players.find((p) => p.userId === currentUserId);
  const isImpostor = myPlayer?.role === "impostor" || myPlayer?.role === "double_agent";

  async function handleFinish() {
    if (!game) return;
    setFinishing(true);
    try {
      const result = await finishGame(game.id);
      if (result.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    } finally {
      setFinishing(false);
    }
  }

  const outcomeConfig = {
    impostors_caught: {
      title: "Impostors Caught! 🎉",
      subtitle: "The innocent players win!",
      color: "text-green-400",
      bg: "from-green-900/30 to-green-800/10",
      border: "border-green-500/30",
      icon: "🏆",
    },
    impostors_win: {
      title: "Impostors Win! 😈",
      subtitle: "The deception was perfect!",
      color: "text-red-400",
      bg: "from-red-900/30 to-red-800/10",
      border: "border-red-500/30",
      icon: "💀",
    },
    no_elimination: {
      title: "No Elimination",
      subtitle: "Nobody was voted out this round",
      color: "text-yellow-400",
      bg: "from-yellow-900/20 to-yellow-800/10",
      border: "border-yellow-500/30",
      icon: "🎲",
    },
  };

  const outcome = outcomeConfig[reveal.outcome];

  return (
    <div className="min-h-screen overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Outcome banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`glass-card p-8 text-center bg-gradient-to-br ${outcome.bg} border ${outcome.border}`}
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-6xl mb-4"
          >
            {outcome.icon}
          </motion.div>
          <h1 className={`text-4xl font-black ${outcome.color} mb-2`}>{outcome.title}</h1>
          <p className="text-white/60">{outcome.subtitle}</p>

          {/* Secret word */}
          <div className="mt-6 inline-flex flex-col items-center">
            <p className="text-white/40 text-xs uppercase tracking-widest mb-1">The Secret Word Was</p>
            <div className="text-3xl font-black text-white px-6 py-2 rounded-xl bg-white/10 border border-white/20">
              {reveal.secretWord}
            </div>
            <p className="text-white/40 text-sm mt-1">{reveal.category}</p>
          </div>
        </motion.div>

        {/* Player roles reveal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-5"
        >
          <h2 className="font-bold text-white mb-4 flex items-center gap-2">
            🎭 Player Roles Revealed
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {reveal.players.map((p, i) => {
              const isImpostorPlayer = p.role === "impostor" || p.role === "double_agent";
              const isElim = reveal.eliminatedPlayer === p.userId;
              const ability = p.ability ? ALL_ABILITIES[p.ability] : null;

              return (
                <motion.div
                  key={p.userId}
                  initial={{ opacity: 0, rotateY: 90 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className={`p-4 rounded-xl border text-center ${
                    isImpostorPlayer
                      ? "border-red-500/40 bg-red-500/10"
                      : "border-green-500/30 bg-green-500/5"
                  } ${isElim ? "ring-2 ring-red-500/60" : ""}`}
                >
                  <div className="text-3xl mb-2">
                    {isImpostorPlayer ? "😈" : "🕵️"}
                  </div>
                  <p className="font-bold text-white text-sm truncate">{p.displayName}</p>
                  <Badge
                    variant={isImpostorPlayer ? "impostor" : "innocent"}
                    className="text-xs mt-1"
                  >
                    {p.role === "double_agent" ? "Double Agent" : p.role}
                  </Badge>
                  {p.wordShown && (
                    <p className="text-white/50 text-xs mt-1 truncate">&ldquo;{p.wordShown}&rdquo;</p>
                  )}
                  {ability && (
                    <p className={`text-xs mt-1 ${ability.color}`}>
                      {ability.icon} {p.abilityUsed ? "Used" : "Unused"}
                    </p>
                  )}
                  {isElim && (
                    <div className="mt-1 text-red-400 text-xs font-bold">☠️ Eliminated</div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Twist used */}
        {reveal.twist && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`glass-card p-5 bg-gradient-to-r ${reveal.twist.color} bg-opacity-10 border border-white/20`}
          >
            <h3 className="font-bold text-white mb-2">Active Twist</h3>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{reveal.twist.icon}</span>
              <div>
                <p className="font-bold text-white">{reveal.twist.name}</p>
                <p className="text-white/60 text-sm">{reveal.twist.description}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* XP & Rewards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-5"
        >
          <h2 className="font-bold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Rewards
          </h2>
          <div className="space-y-2">
            {reveal.xpBreakdown.map((r, i) => {
              const isMe = r.userId === currentUserId;
              return (
                <motion.div
                  key={r.userId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.05 }}
                  className={`flex items-center justify-between p-3 rounded-xl ${
                    isMe ? "bg-purple-500/20 border border-purple-500/30" : "bg-white/5"
                  }`}
                >
                  <span className="text-white font-medium text-sm">
                    {isMe ? "You" : r.displayName}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-yellow-400 flex items-center gap-1 text-sm">
                      <Coins className="w-3.5 h-3.5" />+{r.coins}
                    </span>
                    <span className="text-purple-300 flex items-center gap-1 text-sm">
                      <Star className="w-3.5 h-3.5" />+{r.xp} XP
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Host controls */}
        <div className="flex gap-3">
          {isHost ? (
            <Button
              variant="game"
              size="lg"
              className="flex-1"
              onClick={handleFinish}
              loading={finishing}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Return to Lobby
            </Button>
          ) : (
            <div className="flex-1 glass-card p-4 text-center text-white/50 text-sm">
              Waiting for host to continue...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
