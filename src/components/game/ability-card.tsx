"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ability, GamePlayerState } from "@/types/game";
import { Button } from "@/components/ui/button";
import { PlayerAvatar } from "@/components/game/player-avatar";

interface AbilityCardProps {
  ability: Ability;
  players: GamePlayerState[];
  onUse: (abilityType: string, targetUserId?: string) => Promise<void>;
  // FIX: derive used state from server, not local state
  alreadyUsed?: boolean;
}

const ABILITIES_NEEDING_TARGET = [
  "reveal_category",
  "force_first",
  "cancel_ability",
  "swap_votes",
  "freeze_timer",
  "force_random_first",
];

export function AbilityCard({ ability, players, onUse, alreadyUsed = false }: AbilityCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectingTarget, setSelectingTarget] = useState(false);
  const [loading, setLoading] = useState(false);

  // FIX: don't render if already used (controlled by parent via server state)
  if (alreadyUsed) return null;

  const needsTarget = ABILITIES_NEEDING_TARGET.includes(ability.type);

  async function handleUse(targetUserId?: string) {
    setLoading(true);
    try {
      await onUse(ability.type, targetUserId);
      setSelectingTarget(false);
      setExpanded(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center gap-3 text-left hover:bg-yellow-500/10 transition-colors"
        type="button"
      >
        <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center text-xl flex-shrink-0">
          {ability.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-yellow-300 text-[10px] uppercase tracking-widest mb-0.5">Special Ability</p>
          <p className={`font-bold ${ability.color}`}>{ability.name}</p>
          <p className="text-white/50 text-xs truncate">{ability.description}</p>
        </div>
        <span className="text-white/30 text-xs flex-shrink-0">{expanded ? "▲" : "▼"}</span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              <p className="text-white/60 text-sm">{ability.description}</p>
              <p className="text-white/40 text-xs italic">Single use — choose wisely!</p>

              {!selectingTarget ? (
                <Button
                  variant="gold"
                  size="sm"
                  className="w-full"
                  loading={loading}
                  onClick={() => needsTarget && players.length > 0
                    ? setSelectingTarget(true)
                    : handleUse()
                  }
                  type="button"
                >
                  ⚡ Use Ability
                </Button>
              ) : (
                <div className="space-y-2">
                  <p className="text-white/60 text-xs font-semibold">Choose a target:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {players.map((p) => (
                      <button
                        key={p.userId}
                        onClick={() => handleUse(p.userId)}
                        disabled={loading}
                        className="flex items-center gap-2 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
                        type="button"
                      >
                        <PlayerAvatar avatar={p.avatar} size="sm" />
                        <span className="text-white text-sm truncate">{p.displayName}</span>
                      </button>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-white/40"
                    onClick={() => setSelectingTarget(false)}
                    type="button"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
