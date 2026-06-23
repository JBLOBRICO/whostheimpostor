"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ability } from "@/types/game";
import { GamePlayerState } from "@/types/game";
import { Button } from "@/components/ui/button";
import { PlayerAvatar } from "@/components/game/player-avatar";

interface AbilityCardProps {
  ability: Ability;
  players: GamePlayerState[];
  onUse: (abilityType: string, targetUserId?: string) => void;
}

const ABILITIES_NEEDING_TARGET = [
  "reveal_category",
  "force_first",
  "cancel_ability",
  "swap_votes",
  "freeze_timer",
];

export function AbilityCard({ ability, players, onUse }: AbilityCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectingTarget, setSelectingTarget] = useState(false);
  const [used, setUsed] = useState(false);

  const needsTarget = ABILITIES_NEEDING_TARGET.includes(ability.type);

  async function handleUse(targetUserId?: string) {
    setUsed(true);
    onUse(ability.type, targetUserId);
    setSelectingTarget(false);
  }

  if (used) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center gap-3 text-left hover:bg-yellow-500/10 transition-colors"
      >
        <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center text-xl flex-shrink-0">
          {ability.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-yellow-300 text-xs uppercase tracking-widest mb-0.5">Special Ability</p>
          <p className={`font-bold ${ability.color}`}>{ability.name}</p>
          <p className="text-white/50 text-xs truncate">{ability.description}</p>
        </div>
        <span className="text-white/30 text-xs">{expanded ? "▲" : "▼"}</span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              <p className="text-white/60 text-sm mb-3">{ability.description}</p>

              {!selectingTarget ? (
                <Button
                  variant="gold"
                  size="sm"
                  className="w-full"
                  onClick={() => needsTarget ? setSelectingTarget(true) : handleUse()}
                >
                  ⚡ Use Ability
                </Button>
              ) : (
                <div className="space-y-2">
                  <p className="text-white/70 text-xs mb-2">Select a target:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {players.map((p) => (
                      <button
                        key={p.userId}
                        onClick={() => handleUse(p.userId)}
                        className="flex items-center gap-2 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                      >
                        <PlayerAvatar avatar={p.avatar} size="sm" />
                        <span className="text-white text-sm truncate">{p.displayName}</span>
                      </button>
                    ))}
                  </div>
                  <Button variant="ghost" size="sm" className="w-full text-white/40" onClick={() => setSelectingTarget(false)}>
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
