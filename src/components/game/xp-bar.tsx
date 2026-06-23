"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface XPBarProps {
  level: number;
  xpInLevel: number;
  xpForNext: number;
  className?: string;
  compact?: boolean;
}

export function XPBar({ level, xpInLevel, xpForNext, className, compact }: XPBarProps) {
  const percentage = Math.min((xpInLevel / xpForNext) * 100, 100);

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <span className="text-xs text-purple-400 font-bold whitespace-nowrap">Lv. {level}</span>
        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
          />
        </div>
        <span className="text-xs text-white/40 whitespace-nowrap">{xpInLevel}/{xpForNext}</span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-purple-400 font-bold">Level {level}</span>
        <span className="text-white/40">{xpInLevel} / {xpForNext} XP</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-full relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent shimmer-bg rounded-full" />
        </motion.div>
      </div>
    </div>
  );
}
