import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateRoomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function calculateXPForLevel(level: number): number {
  // XP required to reach this level from level 1
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

export function calculateLevelFromXP(xp: number): { level: number; xpInLevel: number; xpForNext: number } {
  let level = 1;
  let totalXP = 0;
  while (totalXP + calculateXPForLevel(level) <= xp) {
    totalXP += calculateXPForLevel(level);
    level++;
  }
  return {
    level,
    xpInLevel: xp - totalXP,
    xpForNext: calculateXPForLevel(level),
  };
}

export function calculateGameRewards(
  won: boolean,
  isImpostor: boolean,
  correctGuess: boolean,
  roundsPlayed: number,
  dailyMultiplier: number = 1
): { xp: number; coins: number; reasons: string[] } {
  let xp = 0;
  let coins = 0;
  const reasons: string[] = [];

  // Base participation
  xp += 10 * roundsPlayed;
  coins += 5 * roundsPlayed;
  reasons.push(`Participation: +${10 * roundsPlayed} XP`);

  if (won) {
    xp += 50;
    coins += 25;
    reasons.push("Victory: +50 XP, +25 coins");
  }

  if (isImpostor && won) {
    xp += 75;
    coins += 40;
    reasons.push("Impostor Win Bonus: +75 XP, +40 coins");
  }

  if (correctGuess) {
    xp += 30;
    coins += 15;
    reasons.push("Correct Guess: +30 XP, +15 coins");
  }

  // Apply daily multiplier
  if (dailyMultiplier > 1) {
    xp = Math.floor(xp * dailyMultiplier);
    coins = Math.floor(coins * dailyMultiplier);
    reasons.push(`Daily Event Bonus: x${dailyMultiplier}`);
  }

  return { xp, coins, reasons };
}

export function getRankColor(rank: string): string {
  const colors: Record<string, string> = {
    bronze: "text-orange-400",
    silver: "text-gray-300",
    gold: "text-yellow-400",
    platinum: "text-cyan-300",
    diamond: "text-blue-400",
    master: "text-purple-400",
  };
  return colors[rank] ?? "text-gray-400";
}

export function getRankIcon(rank: string): string {
  const icons: Record<string, string> = {
    bronze: "🥉",
    silver: "🥈",
    gold: "🥇",
    platinum: "💠",
    diamond: "💎",
    master: "👑",
  };
  return icons[rank] ?? "⚔️";
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function shuffleArray<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function timeAgo(date: Date | number): string {
  const now = Date.now();
  const then = typeof date === "number" ? date : date.getTime();
  const diff = now - then;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}
