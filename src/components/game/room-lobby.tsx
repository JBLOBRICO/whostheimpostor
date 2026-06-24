"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { RoomState, ChatMessage } from "@/types/game";
import { Button } from "@/components/ui/button";
import { PlayerAvatar } from "@/components/game/player-avatar";
import { Badge } from "@/components/ui/badge";
import { GameChat } from "@/components/game/game-chat";
import { startGame, } from "@/lib/actions/game";
import { leaveRoom, setPlayerReady, kickPlayer } from "@/lib/actions/room";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import {
  Copy, Play, LogOut, Crown, Users, Clock, Shield, Zap, Eye, Settings,
} from "lucide-react";

interface RoomLobbyProps {
  roomState: RoomState;
  currentUserId: string;
  messages: ChatMessage[];
  roomId: string;
}

export function RoomLobby({ roomState, currentUserId, messages, roomId }: RoomLobbyProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [starting, setStarting] = useState(false);

  const isHost = roomState.hostId === currentUserId;
  const currentPlayer = roomState.players.find((p) => p.userId === currentUserId);
  const allReady = roomState.players.filter((p) => !p.isHost).every((p) => p.isReady);
  const canStart = roomState.players.length >= 4;

  async function handleStart() {
    if (!isHost) return;
    setStarting(true);
    try {
      const result = await startGame(roomId);
      if (result.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    } finally {
      setStarting(false);
    }
  }

  async function handleLeave() {
    await leaveRoom(roomId);
    router.push("/dashboard");
  }

  async function handleReady() {
    await setPlayerReady(roomId, !currentPlayer?.isReady);
  }

  function copyCode() {
    navigator.clipboard.writeText(roomState.code);
    toast({ title: "Copied!", description: `Room code ${roomState.code} copied to clipboard` });
  }

  async function handleKick(userId: string) {
    if (!isHost) return;
    await kickPlayer(roomId, userId);
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass border-b border-white/10 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">🕵️</span>
            <div>
              <h1 className="font-bold text-white">{roomState.name || "Game Room"}</h1>
              <p className="text-white/40 text-xs flex items-center gap-1">
                <Users className="w-3 h-3" />
                {roomState.players.length}/{roomState.settings.maxPlayers} players
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Room code */}
            <button
              onClick={copyCode}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 py-1.5 transition-all group"
            >
              <span className="font-mono font-bold text-purple-300 tracking-widest">
                {roomState.code}
              </span>
              <Copy className="w-3.5 h-3.5 text-white/40 group-hover:text-white/60" />
            </button>
            <Button variant="ghost" size="icon-sm" onClick={handleLeave}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 grid lg:grid-cols-3 gap-6">
        {/* Left: Player List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Players grid */}
          <div className="glass-card p-5">
            <h2 className="font-bold text-white mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              Players ({roomState.players.length}/{roomState.settings.maxPlayers})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {roomState.players.map((player, i) => (
                <motion.div
                  key={player.userId}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={`relative p-3 rounded-xl border transition-all group ${
                    player.isReady || player.isHost
                      ? "border-green-500/40 bg-green-500/10"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2 text-center">
                    <PlayerAvatar
                      avatar={player.avatar}
                      border={player.border}
                      size="lg"
                      level={player.level}
                      isHost={player.isHost}
                    />
                    <div>
                      <p className="text-white font-medium text-sm truncate max-w-[80px]">
                        {player.displayName}
                      </p>
                      <p className="text-white/40 text-xs">{player.title}</p>
                    </div>
                    <div>
                      {player.isHost ? (
                        <Badge variant="warning" className="text-xs">
                          <Crown className="w-3 h-3 mr-1" />Host
                        </Badge>
                      ) : player.isReady ? (
                        <Badge variant="success" className="text-xs">Ready</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-white/40">Waiting</Badge>
                      )}
                    </div>
                  </div>

                  {/* Kick button for host */}
                  {isHost && player.userId !== currentUserId && (
                    <button
                      onClick={() => handleKick(player.userId)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Kick player"
                    >
                      ×
                    </button>
                  )}
                </motion.div>
              ))}

              {/* Empty slots */}
              {Array.from({
                length: Math.max(0, roomState.settings.maxPlayers - roomState.players.length),
              }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="p-3 rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-2 min-h-[100px]"
                >
                  <div className="w-10 h-10 rounded-full bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center text-white/20">
                    ?
                  </div>
                  <span className="text-white/20 text-xs">Waiting...</span>
                </div>
              ))}
            </div>
          </div>

          {/* Settings summary */}
          <div className="glass-card p-5">
            <h3 className="font-bold text-white mb-3 flex items-center gap-2">
              <Settings className="w-4 h-4 text-blue-400" />
              Game Settings
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { icon: <Clock className="w-3.5 h-3.5" />, label: "Discussion", value: `${roomState.settings.discussionTime}s` },
                { icon: <Clock className="w-3.5 h-3.5" />, label: "Voting", value: `${roomState.settings.votingTime}s` },
                { icon: <Eye className="w-3.5 h-3.5" />, label: "Impostors", value: roomState.settings.numImpostors },
                { icon: <Shield className="w-3.5 h-3.5" />, label: "Voting", value: roomState.settings.anonymousVoting ? "Anonymous" : "Public" },
                { icon: <Zap className="w-3.5 h-3.5" />, label: "Abilities", value: roomState.settings.enableAbilities ? "On" : "Off" },
                { icon: <Zap className="w-3.5 h-3.5" />, label: "Twists", value: roomState.settings.enableTwists ? "On" : "Off" },
              ].map((s) => (
                <div key={s.label} className="bg-white/5 rounded-lg p-2.5 flex items-center gap-2">
                  <span className="text-white/40">{s.icon}</span>
                  <div>
                    <p className="text-white/40 text-xs">{s.label}</p>
                    <p className="text-white font-medium text-sm">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Chat + Controls */}
        <div className="space-y-4">
          {/* Action buttons */}
          <div className="space-y-2">
            {isHost ? (
              <Button
                variant="game"
                size="lg"
                className="w-full"
                onClick={handleStart}
                loading={starting}
                disabled={!canStart}
              >
                <Play className="w-4 h-4 mr-2" />
                {canStart ? "Start Game" : `Need ${4 - roomState.players.length} more players`}
              </Button>
            ) : (
              <Button
                variant={currentPlayer?.isReady ? "outline" : "success"}
                size="lg"
                className="w-full"
                onClick={handleReady}
              >
                {currentPlayer?.isReady ? "✓ Ready — Click to Unready" : "Mark as Ready"}
              </Button>
            )}
            <Button variant="ghost" size="sm" className="w-full text-white/50" onClick={handleLeave}>
              <LogOut className="w-3.5 h-3.5 mr-2" />
              Leave Room
            </Button>
          </div>

          {/* Mode badge */}
          <div className="glass-card p-4 text-center">
            <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Mode</p>
            <Badge variant="purple" className="text-sm px-3">
              {roomState.settings.gameMode === "classic" && "🎭 Classic"}
              {roomState.settings.gameMode === "chaos" && "🌪️ Chaos"}
              {roomState.settings.gameMode === "ranked" && "🏆 Ranked"}
              {roomState.settings.gameMode === "custom" && "⚙️ Custom"}
            </Badge>
          </div>

          {/* Chat */}
          <GameChat
            messages={messages}
            roomId={roomId}
            currentUserId={currentUserId}
            currentUserAvatar={currentPlayer?.avatar ?? "default"}
            currentUserName={currentPlayer?.displayName ?? "You"}
            className="h-[350px]"
          />
        </div>
      </main>
    </div>
  );
}
