"use client";

import { cn } from "@/lib/utils";
import { AVATARS } from "@/lib/game-data/cosmetics";

interface PlayerAvatarProps {
  avatar: string;
  border?: string;
  size?: "sm" | "md" | "lg" | "xl";
  level?: number;
  className?: string;
  isEliminated?: boolean;
  isSpeaking?: boolean;
  isHost?: boolean;
}

const SIZE_CLASSES = {
  sm: "w-8 h-8 text-lg",
  md: "w-10 h-10 text-xl",
  lg: "w-14 h-14 text-3xl",
  xl: "w-20 h-20 text-5xl",
};

const BORDER_COLORS: Record<string, string> = {
  none: "border-white/20",
  gold: "border-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.4)]",
  neon_blue: "border-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.4)]",
  neon_pink: "border-pink-400 shadow-[0_0_10px_rgba(244,114,182,0.4)]",
  fire: "border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]",
  ice: "border-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.4)]",
  rainbow: "border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]",
  void: "border-gray-600",
};

export function PlayerAvatar({
  avatar,
  border = "none",
  size = "md",
  level,
  className,
  isEliminated,
  isSpeaking,
  isHost,
}: PlayerAvatarProps) {
  const avatarDef = AVATARS.find((a) => a.key === avatar) ?? AVATARS[0];
  const borderClass = BORDER_COLORS[border] ?? BORDER_COLORS.none;

  return (
    <div className={cn("relative flex-shrink-0", className)}>
      {/* Speaking indicator */}
      {isSpeaking && (
        <div className="absolute inset-0 rounded-full border-2 border-green-400 animate-pulse-ring -z-10" />
      )}

      {/* Avatar circle */}
      <div
        className={cn(
          "rounded-full border-2 bg-white/5 flex items-center justify-center transition-all",
          SIZE_CLASSES[size],
          borderClass,
          isEliminated && "opacity-40 grayscale",
          isSpeaking && "ring-2 ring-green-400 ring-offset-1 ring-offset-transparent"
        )}
      >
        <span className="select-none">{avatarDef.preview}</span>
      </div>

      {/* Host crown */}
      {isHost && (
        <div className="absolute -top-2 -right-1 text-xs">👑</div>
      )}

      {/* Level badge */}
      {level !== undefined && size !== "sm" && (
        <div className={cn(
          "absolute -bottom-1 -right-1 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold",
          size === "lg" || size === "xl" ? "w-6 h-6 text-xs" : "w-5 h-5 text-[10px]"
        )}>
          {level}
        </div>
      )}

      {/* Eliminated X */}
      {isEliminated && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-red-400 font-black text-xl opacity-80">✕</div>
        </div>
      )}
    </div>
  );
}
