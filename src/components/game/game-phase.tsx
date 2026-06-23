"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { Clock, Vote, Play, MessageSquare } from "lucide-react";

interface GamePhaseProps {
  roomState: RoomState;
  currentUserId: string;
  messages: ChatMessage[];
  roomId: string;
}

export function GamePhase({ roomState, currentUserId, messages, roomId }: GamePhaseProps) {
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedVote, setSelectedVote] = useState<string | null>(undefined as unknown as null);
  const [votingFor, setVotingFor] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  const game = roomState.currentGame!;
  const isHost = roomState.hostId === currentUserId;
  const status = game.status;
  const silentRound = game.activeTwist?.type === "silent_round";

  const myPlayer = game.players.find((p) => p.userId === currentUserId);
  const myAbility = myPlayer?.ability ? ALL_ABILITIES[myPlayer.ability] : null;

  // Countdown timer
  useEffect(() => {
    let startTime: number;
    let limit: number;

    if (status === "discussion" && game.discussionStartedAt) {
      startTime = game.discussionStartedAt;
      limit = game.discussionTimeLimit;
    } else if (status === "voting" && game.votingStartedAt) {
      startTime = game.votingStartedAt;
      limit = game.votingTimeLimit;
    } else {
      return;
    }

    const update = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, limit - elapsed);
      setTimeLeft(remaining);
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [status, game.discussionStartedAt, game.votingStartedAt, game.discussionTimeLimit, game.votingTimeLimit]);

  // Auto-advance when time runs out (host only)
  useEffect(() => {
    if (!isHost || timeLeft > 0) return;
    if (status === "discussion") {
      startVoting(game.id);
    }
    // Voting auto-completes via server when all vote
  }, [timeLeft, isHost, status, game.id]);

  async function handleStartDiscussion() {
    const result = await startDiscussion(game.id);
    if (result.error) toast({ title: "Error", description: result.error, variant: "destructive" });
  }

  async function handleStartVoting() {
    const result = await startVoting(game.id);
    if (result.error) toast({ title: "Error", description: result.error, variant: "destructive" });
  }

  async function handleVote(targetUserId: string | null) {
    if (hasVoted) return;
    setVotingFor(targetUserId);
    const result = await castVote(game.id, targetUserId);
    if (result.error) {
      toast({ title: "Vote failed", description: result.error, variant: "destructive" });
      setVotingFor(null);
    } else {
      setHasVoted(true);
      setSelectedVote(targetUserId);
      toast({ title: "Vote cast!", description: targetUserId ? "Your vote is locked in." : "You skipped the vote." });
    }
  }

  async function handleUseAbility(abilityType: string, targetUserId?: string) {
    const result = await useAbility(game.id, abilityType, targetUserId);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Ability used!", description: "Your ability has been activated." });
    }
  }

  const activePlayers = game.players.filter((p) => !p.isEliminated);
  const timePct = status === "discussion"
    ? (timeLeft / game.discussionTimeLimit) * 100
    : (timeLeft / game.votingTimeLimit) * 100;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Game Header */}
      <header className="glass border-b border-white/10 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                status === "discussion" ? "bg-green-400 animate-pulse" :
                status === "voting" ? "bg-red-400 animate-pulse" : "bg-yellow-400"
              }`} />
              <span className="font-bold text-white capitalize text-sm">
                {status === "assigning" ? "Getting Ready..." :
                 status === "discussion" ? "Discussion Phase" :
                 status === "voting" ? "Voting Phase" : status}
              </span>
            </div>
            {game.activeTwist && (
              <Badge variant="purple" className="text-xs">
                {game.activeTwist.icon} {game.activeTwist.name}
              </Badge>
            )}
          </div>

          {/* Timer */}
          {(status === "discussion" || status === "voting") && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-white/50" />
              <span className={`font-mono font-bold text-lg ${
                timeLeft <= 10 ? "text-red-400 animate-pulse" : "text-white"
              }`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          )}
        </div>

        {/* Timer bar */}
        {(status === "discussion" || status === "voting") && (
          <div className="max-w-6xl mx-auto mt-2">
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full transition-all duration-1000 ${
                  timePct > 50 ? "bg-green-500" : timePct > 20 ? "bg-yellow-500" : "bg-red-500"
                }`}
                style={{ width: `${timePct}%` }}
              />
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-4 grid lg:grid-cols-3 gap-4">
        {/* Left: Main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Assigning phase */}
          {status === "assigning" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-6 text-center"
            >
              <div className="text-5xl mb-4 animate-bounce-in">🎭</div>
              <h2 className="text-2xl font-bold text-white mb-2">Roles Assigned!</h2>
              <p className="text-white/60 mb-6">
                Check your secret role below. Keep it hidden!
              </p>

              <WordReveal
                role={myPlayer?.role}
                wordShown={myPlayer?.wordShown}
                category={game.category}
                twist={game.activeTwist}
                ability={myAbility}
                memoryLoss={game.activeTwist?.type === "memory_loss"}
              />

              {isHost && (
                <Button variant="game" size="lg" className="mt-6" onClick={handleStartDiscussion}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Start Discussion
                </Button>
              )}
              {!isHost && (
                <p className="text-white/40 text-sm mt-4 animate-pulse">
                  Waiting for host to start discussion...
                </p>
              )}
            </motion.div>
          )}

          {/* Discussion phase */}
          {status === "discussion" && (
            <div className="space-y-4">
              {/* My role reminder */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl p-4 border ${
                  myPlayer?.role === "impostor" || myPlayer?.role === "double_agent"
                    ? "border-red-500/30 bg-red-500/10"
                    : "border-green-500/30 bg-green-500/10"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    myPlayer?.role === "impostor" || myPlayer?.role === "double_agent"
                      ? "bg-red-500/20 text-red-300"
                      : "bg-green-500/20 text-green-300"
                  }`}>
                    {myPlayer?.role === "impostor" || myPlayer?.role === "double_agent" ? "😈" : "🕵️"}
                  </div>
                  <div>
                    <p className="text-white/50 text-xs uppercase tracking-widest">Your Role</p>
                    <p className="font-bold text-white capitalize">
                      {myPlayer?.role === "double_agent" ? "Double Agent" : myPlayer?.role}
                    </p>
                    {myPlayer?.wordShown && (
                      <p className="text-white/70 text-sm">
                        Word: <span className="font-bold text-white">{myPlayer.wordShown}</span>
                      </p>
                    )}
                    {!myPlayer?.wordShown && (
                      <p className="text-white/50 text-sm italic">No word given</p>
                    )}
                  </div>
                  {game.category && (
                    <Badge variant="outline" className="ml-auto text-xs border-white/20 text-white/50">
                      {game.category}
                    </Badge>
                  )}
                </div>
              </motion.div>

              {/* Players */}
              <div className="glass-card p-4">
                <h3 className="font-semibold text-white/70 text-sm mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Players
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {activePlayers.map((p) => (
                    <PlayerCard key={p.userId} player={p} isMe={p.userId === currentUserId} />
                  ))}
                </div>
              </div>

              {/* Ability */}
              {myAbility && !myPlayer?.abilityUsed && (
                <AbilityCard
                  ability={myAbility}
                  players={activePlayers.filter((p) => p.userId !== currentUserId)}
                  onUse={handleUseAbility}
                />
              )}

              {/* Host controls */}
              {isHost && (
                <Button variant="game" className="w-full" onClick={handleStartVoting}>
                  <Vote className="w-4 h-4 mr-2" />
                  Start Voting Early
                </Button>
              )}
            </div>
          )}

          {/* Voting phase */}
          {status === "voting" && (
            <div className="space-y-4">
              <div className="glass-card p-5">
                <h2 className="font-bold text-white text-xl mb-1 flex items-center gap-2">
                  <Vote className="w-5 h-5 text-red-400" />
                  Vote for the Impostor
                </h2>
                <p className="text-white/50 text-sm mb-4">
                  {hasVoted ? "Your vote has been cast!" : "Choose wisely — who do you think it is?"}
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
                        onVote={() => !hasVoted && handleVote(p.userId)}
                        isAnonymous={roomState.settings.anonymousVoting}
                      />
                    ))}
                </div>

                {!hasVoted && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-white/50"
                    onClick={() => handleVote(null)}
                  >
                    Skip Vote (Pass)
                  </Button>
                )}
              </div>

              {/* Ability during voting */}
              {myAbility && !myPlayer?.abilityUsed && (
                <AbilityCard
                  ability={myAbility}
                  players={activePlayers.filter((p) => p.userId !== currentUserId)}
                  onUse={handleUseAbility}
                />
              )}
            </div>
          )}
        </div>

        {/* Right: Chat */}
        <div>
          <GameChat
            messages={messages}
            roomId={roomId}
            currentUserId={currentUserId}
            silentRound={silentRound && status === "discussion"}
            className="h-[calc(100vh-200px)] sticky top-4"
          />
        </div>
      </main>
    </div>
  );
}

function PlayerCard({ player, isMe }: { player: GamePlayerState; isMe: boolean }) {
  return (
    <div className={`p-3 rounded-xl border ${
      isMe ? "border-purple-500/30 bg-purple-500/10" : "border-white/10 bg-white/5"
    } flex items-center gap-2`}>
      <PlayerAvatar avatar={player.avatar} border={player.border} size="sm" />
      <div className="min-w-0">
        <p className="text-white text-sm font-medium truncate">{player.displayName}</p>
        {isMe && <p className="text-purple-400 text-xs">You</p>}
      </div>
    </div>
  );
}

function VoteCard({
  player,
  isSelected,
  hasVoted,
  onVote,
  isAnonymous,
}: {
  player: GamePlayerState;
  isSelected: boolean;
  hasVoted: boolean;
  onVote: () => void;
  isAnonymous: boolean;
}) {
  return (
    <motion.button
      whileHover={!hasVoted ? { scale: 1.03 } : {}}
      whileTap={!hasVoted ? { scale: 0.97 } : {}}
      onClick={onVote}
      disabled={hasVoted}
      className={`p-4 rounded-xl border transition-all text-center ${
        isSelected
          ? "border-red-500/60 bg-red-500/20 glow-red"
          : hasVoted
          ? "border-white/10 bg-white/5 opacity-60"
          : "border-white/10 bg-white/5 hover:border-red-500/30 hover:bg-red-500/10 cursor-pointer"
      }`}
    >
      <PlayerAvatar
        avatar={player.avatar}
        border={player.border}
        size="md"
        className="mx-auto mb-2"
      />
      <p className="text-white text-sm font-medium truncate">{player.displayName}</p>
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="mt-1"
        >
          <Badge variant="impostor" className="text-xs">YOUR VOTE</Badge>
        </motion.div>
      )}
      {!isAnonymous && player.votesReceived !== undefined && player.votesReceived > 0 && (
        <div className="mt-1 text-xs text-red-400 font-bold">
          {player.votesReceived} vote{player.votesReceived !== 1 ? "s" : ""}
        </div>
      )}
    </motion.button>
  );
}
