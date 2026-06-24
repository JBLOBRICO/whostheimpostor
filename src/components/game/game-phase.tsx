"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { RoomState, ChatMessage, GamePlayerState } from "@/types/game";
import { Button } from "@/components/ui/button";
import { PlayerAvatar } from "@/components/game/player-avatar";
import { GameChat } from "@/components/game/game-chat";
import { WordReveal } from "@/components/game/word-reveal";
import { AbilityCard } from "@/components/game/ability-card";
import { Badge } from "@/components/ui/badge";
import { startDiscussion, startVoting, castVote, useAbility } from "@/lib/actions/game";
import { useToast } from "@/hooks/use-toast";
import { formatTime } from "@/lib/utils";
import { ALL_ABILITIES } from "@/lib/game-data/abilities";
import { Clock, Vote, MessageSquare } from "lucide-react";

interface GamePhaseProps {
  roomState: RoomState;
  currentUserId: string;
  messages: ChatMessage[];
  roomId: string;
}

export function GamePhase({ roomState, currentUserId, messages, roomId }: GamePhaseProps) {
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [votingInProgress, setVotingInProgress] = useState(false);
  const autoAdvancedRef = useRef(false); // prevent firing multiple times
  const prevStatusRef = useRef<string>("");

  const game = roomState.currentGame!;
  const isHost = roomState.hostId === currentUserId;
  const status = game.status;
  const silentRound = game.activeTwist?.type === "silent_round";
  const myPlayer = game.players.find((p) => p.userId === currentUserId);
  const myAbility = myPlayer?.ability ? ALL_ABILITIES[myPlayer.ability] : null;
  const activePlayers = game.players.filter((p) => !p.isEliminated);
  // FIX: declare maxTime early so useEffect dependency array can reference it
  const maxTime = status === "discussion" ? game.discussionTimeLimit : game.votingTimeLimit;

  // Reset vote state when phase changes to voting
  useEffect(() => {
    if (status !== prevStatusRef.current) {
      prevStatusRef.current = status;
      if (status === "voting") {
        setHasVoted(false);
        setSelectedVote(null);
        autoAdvancedRef.current = false;
      }
      if (status === "discussion") {
        autoAdvancedRef.current = false;
      }
    }
  }, [status]);

  // Check if current user already voted (from server state)
  useEffect(() => {
    if (status === "voting" && myPlayer) {
      const alreadyVoted = game.players.find((p) => p.userId === currentUserId)?.hasVoted;
      if (alreadyVoted) setHasVoted(true);
    }
  }, [status, game.players, currentUserId, myPlayer]);

  // Countdown timer
  useEffect(() => {
    if (status !== "discussion" && status !== "voting") {
      setTimeLeft(0);
      return;
    }

    const startTime = status === "discussion"
      ? game.discussionStartedAt
      : game.votingStartedAt;
    const limit = status === "discussion"
      ? game.discussionTimeLimit
      : game.votingTimeLimit;

    if (!startTime || !limit) return;

    const update = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setTimeLeft(Math.max(0, limit - elapsed));
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [status, game.discussionStartedAt, game.votingStartedAt, game.discussionTimeLimit, game.votingTimeLimit]);

  // Auto-advance discussion → voting when timer hits 0 (host only, fire once)
  // FIX: guard with maxTime > 0 so it doesn't fire on initial mount before timer starts
  useEffect(() => {
    if (!isHost || timeLeft !== 0 || autoAdvancedRef.current) return;
    if (maxTime === 0) return; // timer not started yet
    if (status === "discussion") {
      autoAdvancedRef.current = true;
      startVoting(game.id).catch(() => { autoAdvancedRef.current = false; });
    }
  }, [timeLeft, isHost, status, game.id, maxTime]);

  async function handleStartDiscussion() {
    const result = await startDiscussion(game.id);
    if (result?.error) toast({ title: "Error", description: result.error, variant: "destructive" });
  }

  async function handleStartVoting() {
    const result = await startVoting(game.id);
    if (result?.error) toast({ title: "Error", description: result.error, variant: "destructive" });
  }

  async function handleVote(targetUserId: string | null) {
    if (hasVoted || votingInProgress) return;
    setVotingInProgress(true);
    try {
      const result = await castVote(game.id, targetUserId);
      if (result?.error) {
        toast({ title: "Vote failed", description: result.error, variant: "destructive" });
      } else {
        setHasVoted(true);
        setSelectedVote(targetUserId);
        toast({
          title: "✅ Vote cast!",
          description: targetUserId ? "Your vote is locked in." : "You passed this vote.",
        });
      }
    } finally {
      setVotingInProgress(false);
    }
  }

  async function handleUseAbility(abilityType: string, targetUserId?: string) {
    const result = await useAbility(game.id, abilityType, targetUserId);
    if (result?.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "⚡ Ability used!", description: "Your ability has been activated." });
    }
  }

  // maxTime declared earlier — use it here for derived values
  const timePct = maxTime > 0 ? Math.max(0, Math.min(100, (timeLeft / maxTime) * 100)) : 0;
  const timerColor = timePct > 50 ? "bg-green-500" : timePct > 20 ? "bg-yellow-500" : "bg-red-500";
  const isEliminated = myPlayer?.isEliminated ?? false;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass border-b border-white/10 px-4 py-3 flex-shrink-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
              status === "discussion" ? "bg-green-400 animate-pulse" :
              status === "voting" ? "bg-red-400 animate-pulse" : "bg-yellow-400"
            }`} />
            <span className="font-bold text-white text-sm truncate">
              {status === "assigning" ? "Roles Assigned" :
               status === "discussion" ? "Discussion" :
               status === "voting" ? "Voting" : status}
            </span>
            {game.activeTwist && (
              <Badge variant="purple" className="text-xs hidden sm:flex flex-shrink-0">
                {game.activeTwist.icon} {game.activeTwist.name}
              </Badge>
            )}
          </div>
          {(status === "discussion" || status === "voting") && (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Clock className="w-4 h-4 text-white/40" />
              <span className={`font-mono font-bold tabular-nums text-lg ${
                timeLeft <= 10 ? "text-red-400 animate-pulse" : "text-white"
              }`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          )}
        </div>
        {(status === "discussion" || status === "voting") && (
          <div className="max-w-6xl mx-auto mt-2">
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              {/* FIX: use animate prop so framer-motion actually transitions the width */}
              <motion.div
                className={`h-full rounded-full ${timerColor}`}
                animate={{ width: `${timePct}%` }}
                transition={{ duration: 0.8, ease: "linear" }}
              />
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-4 grid lg:grid-cols-3 gap-4 min-h-0">
        {/* Left: Game content */}
        <div className="lg:col-span-2 space-y-4 overflow-y-auto">

          {/* ── ASSIGNING ── */}
          {status === "assigning" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-6 text-center"
            >
              <div className="text-5xl mb-4">🎭</div>
              <h2 className="text-2xl font-bold text-white mb-2">Roles Assigned!</h2>
              <p className="text-white/60 mb-6">Your secret role is below. Don&apos;t reveal it!</p>

              <WordReveal
                role={myPlayer?.role}
                wordShown={myPlayer?.wordShown}
                category={game.category}
                twist={game.activeTwist}
                ability={myAbility}
                memoryLoss={game.activeTwist?.type === "memory_loss"}
              />

              {isHost ? (
                <Button variant="game" size="lg" className="mt-6" onClick={handleStartDiscussion}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Start Discussion
                </Button>
              ) : (
                <p className="text-white/40 text-sm mt-6 animate-pulse">
                  Waiting for host to start discussion...
                </p>
              )}
            </motion.div>
          )}

          {/* ── DISCUSSION ── */}
          {status === "discussion" && (
            <div className="space-y-4">
              {/* Role reminder */}
              <div className={`rounded-xl p-4 border flex items-center gap-3 ${
                myPlayer?.role === "impostor" || myPlayer?.role === "double_agent"
                  ? "border-red-500/30 bg-red-500/10"
                  : "border-green-500/30 bg-green-500/10"
              }`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 ${
                  myPlayer?.role === "impostor" || myPlayer?.role === "double_agent"
                    ? "bg-red-500/20" : "bg-green-500/20"
                }`}>
                  {myPlayer?.role === "impostor" || myPlayer?.role === "double_agent" ? "😈" : "🕵️"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/50 text-xs uppercase tracking-widest">Your Role</p>
                  <p className="font-bold text-white capitalize">
                    {myPlayer?.role === "double_agent" ? "Double Agent" : myPlayer?.role ?? "..."}
                  </p>
                  {myPlayer?.wordShown ? (
                    <p className="text-white/70 text-sm truncate">
                      Word: <span className="font-bold text-white">{myPlayer.wordShown}</span>
                    </p>
                  ) : (
                    <p className="text-white/40 text-sm italic">No word — stay vague!</p>
                  )}
                </div>
                {game.category && (
                  <Badge variant="outline" className="text-xs border-white/20 text-white/50 flex-shrink-0">
                    {game.category}
                  </Badge>
                )}
              </div>

              {/* Players in game */}
              <div className="glass-card p-4">
                <h3 className="font-semibold text-white/60 text-xs uppercase tracking-widest mb-3">
                  Players in game
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {activePlayers.map((p) => (
                    <PlayerCard key={p.userId} player={p} isMe={p.userId === currentUserId} />
                  ))}
                </div>
              </div>

              {/* Ability */}
              {myAbility && (
                <AbilityCard
                  ability={myAbility}
                  players={activePlayers.filter((p) => p.userId !== currentUserId)}
                  onUse={handleUseAbility}
                  alreadyUsed={myPlayer?.abilityUsed ?? false}
                />
              )}

              {isHost && (
                <Button variant="game" className="w-full" onClick={handleStartVoting}>
                  <Vote className="w-4 h-4 mr-2" />
                  Start Voting Now
                </Button>
              )}
            </div>
          )}

          {/* ── VOTING ── */}
          {status === "voting" && (
            <div className="space-y-4">
              {/* FIX: show eliminated banner instead of vote UI */}
              {isEliminated ? (
                <div className="glass-card p-8 text-center">
                  <div className="text-5xl mb-3">☠️</div>
                  <h2 className="text-2xl font-bold text-red-400 mb-2">You were eliminated!</h2>
                  <p className="text-white/50">Watch the others vote...</p>
                </div>
              ) : (
              <div className="glass-card p-5">
                <h2 className="font-bold text-white text-xl mb-1 flex items-center gap-2">
                  <Vote className="w-5 h-5 text-red-400" />
                  {hasVoted ? "Vote Cast ✅" : "Who is the Impostor?"}
                </h2>
                <p className="text-white/50 text-sm mb-4">
                  {hasVoted
                    ? "Waiting for all players to vote..."
                    : "Choose carefully — you only get one vote."}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  {activePlayers
                    .filter((p) => p.userId !== currentUserId)
                    .map((p) => (
                      <VoteCard
                        key={p.userId}
                        player={p}
                        isSelected={selectedVote === p.userId}
                        hasVoted={hasVoted}
                        isPending={votingInProgress}
                        onVote={() => handleVote(p.userId)}
                        isAnonymous={roomState.settings.anonymousVoting}
                      />
                    ))}
                </div>

                {!hasVoted && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-white/50 hover:text-white"
                    onClick={() => handleVote(null)}
                    disabled={votingInProgress}
                  >
                    Pass (Skip Vote)
                  </Button>
                )}
              </div>
              )}

              {myAbility && (
                <AbilityCard
                  ability={myAbility}
                  players={activePlayers.filter((p) => p.userId !== currentUserId)}
                  onUse={handleUseAbility}
                  alreadyUsed={myPlayer?.abilityUsed ?? false}
                />
              )}
            </div>
          )}
        </div>

        {/* Right: Chat */}
        <div className="h-[calc(100vh-140px)] sticky top-4">
          <GameChat
            messages={messages}
            roomId={roomId}
            currentUserId={currentUserId}
            currentUserAvatar={myPlayer?.avatar ?? "default"}
            currentUserName={myPlayer?.displayName ?? "You"}
            silentRound={silentRound && status === "discussion"}
            className="h-full"
          />
        </div>
      </main>
    </div>
  );
}

function PlayerCard({ player, isMe }: { player: GamePlayerState; isMe: boolean }) {
  return (
    <div className={`p-3 rounded-xl border flex items-center gap-2 ${
      isMe ? "border-purple-500/30 bg-purple-500/10" : "border-white/10 bg-white/5"
    }`}>
      <PlayerAvatar avatar={player.avatar} border={player.border} size="sm" className="flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-white text-sm font-medium truncate">{player.displayName}</p>
        {isMe && <p className="text-purple-400 text-xs">You</p>}
      </div>
    </div>
  );
}

function VoteCard({
  player, isSelected, hasVoted, isPending, onVote, isAnonymous,
}: {
  player: GamePlayerState;
  isSelected: boolean;
  hasVoted: boolean;
  isPending: boolean;
  onVote: () => void;
  isAnonymous: boolean;
}) {
  return (
    <motion.button
      whileHover={!hasVoted && !isPending ? { scale: 1.03 } : {}}
      whileTap={!hasVoted && !isPending ? { scale: 0.97 } : {}}
      onClick={!hasVoted && !isPending ? onVote : undefined}
      disabled={hasVoted || isPending}
      className={`p-4 rounded-xl border transition-all text-center w-full ${
        isSelected
          ? "border-red-500/70 bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
          : hasVoted
          ? "border-white/10 bg-white/5 opacity-50 cursor-default"
          : "border-white/10 bg-white/5 hover:border-red-400/50 hover:bg-red-500/10 cursor-pointer"
      }`}
    >
      <PlayerAvatar
        avatar={player.avatar}
        border={player.border}
        size="md"
        className="mx-auto mb-2"
        isEliminated={player.isEliminated}
      />
      <p className="text-white text-sm font-medium truncate">{player.displayName}</p>
      {isSelected && (
        <div className="mt-1.5">
          <Badge variant="impostor" className="text-[10px]">YOUR VOTE</Badge>
        </div>
      )}
      {!isAnonymous && player.votesReceived !== undefined && player.votesReceived > 0 && (
        <p className="mt-1 text-xs text-red-400 font-bold animate-vote-count">
          {player.votesReceived} 🗳️
        </p>
      )}
      {player.hasVoted && !isSelected && (
        <p className="mt-1 text-xs text-white/30">voted</p>
      )}
    </motion.button>
  );
}
