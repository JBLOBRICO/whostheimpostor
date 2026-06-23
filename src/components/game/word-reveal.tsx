"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Twist, Ability, PlayerRole } from "@/types/game";
import { Badge } from "@/components/ui/badge";

interface WordRevealProps {
  role?: PlayerRole;
  wordShown?: string | null;
  category?: string;
  twist?: Twist | null;
  ability?: Ability | null;
  memoryLoss?: boolean;
}

export function WordReveal({ role, wordShown, category, twist, ability, memoryLoss }: WordRevealProps) {
  const [wordVisible, setWordVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState(10);

  const isImpostor = role === "impostor" || role === "double_agent";

  // Memory loss — hide word after 10s
  useEffect(() => {
    if (!memoryLoss || !wordShown) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setWordVisible(false);
          clearInterval(timer);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [memoryLoss, wordShown]);

  return (
    <div className="space-y-4">
      {/* Role card */}
      <motion.div
        initial={{ rotateY: 90, opacity: 0 }}
        animate={{ rotateY: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className={`rounded-2xl p-6 border-2 ${
          isImpostor
            ? "border-red-500/50 bg-gradient-to-br from-red-900/40 to-red-800/20 glow-red"
            : "border-green-500/50 bg-gradient-to-br from-green-900/40 to-green-800/20 glow-green"
        }`}
      >
        <div className="text-center">
          <div className="text-5xl mb-3">
            {isImpostor ? "😈" : "🕵️"}
          </div>
          <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Your Role</p>
          <h2 className={`text-3xl font-black ${isImpostor ? "text-red-300" : "text-green-300"}`}>
            {role === "double_agent" ? "DOUBLE AGENT" : isImpostor ? "IMPOSTOR" : "INNOCENT"}
          </h2>
        </div>
      </motion.div>

      {/* Word card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card p-5"
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-white/50 text-xs uppercase tracking-widest">Secret Word</p>
          {category && (
            <Badge variant="outline" className="text-xs border-white/20 text-white/50">
              📂 {category}
            </Badge>
          )}
        </div>

        <AnimatePresence mode="wait">
          {wordShown && wordVisible ? (
            <motion.div
              key="word"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-center"
            >
              <p className="text-4xl font-black text-white">{wordShown}</p>
              {memoryLoss && timeLeft > 0 && (
                <p className="text-yellow-400 text-sm mt-2 animate-pulse">
                  Memorize! Disappears in {timeLeft}s 🧠
                </p>
              )}
            </motion.div>
          ) : wordShown === null || wordShown === undefined ? (
            <motion.div
              key="no-word"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-2"
            >
              <p className="text-4xl font-black text-red-400">???</p>
              <p className="text-white/40 text-sm mt-1">
                {isImpostor ? "No word — you're the Impostor!" : "No word given..."}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-2"
            >
              <p className="text-3xl font-black text-white/20">████████</p>
              <p className="text-yellow-400 text-sm mt-1">Word hidden! (Memory Loss active)</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Ability card */}
      {ability && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4"
        >
          <p className="text-yellow-400/70 text-xs uppercase tracking-widest mb-1">Your Ability</p>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{ability.icon}</span>
            <div>
              <p className={`font-bold ${ability.color}`}>{ability.name}</p>
              <p className="text-white/50 text-xs">{ability.description}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Twist info */}
      {twist && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className={`rounded-xl border p-4 bg-gradient-to-r ${twist.color} bg-opacity-10`}
          style={{ borderColor: "rgba(255,255,255,0.2)" }}
        >
          <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Active Twist</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{twist.icon}</span>
            <div>
              <p className="font-bold text-white">{twist.name}</p>
              <p className="text-white/60 text-xs">{twist.description}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
