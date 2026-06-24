"use client";

import { useState, useEffect, useRef } from "react";
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
import { Clock, Vote, MessageSquare, ChevronRight, Mic } from "lucide-react";

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
  const [activeSpeakerIdx, setActiveSpeakerIdx] = useState(0);
  const autoAdvancedRef = useRef(false);
  const prevStatusRef = useRef<string>("");

  const game = roomState.currentGame!;
  const isHost = roomState.hostId === currentUserId;
  const status = game.status;
  const silentRound = game.activeTwist?.type === "silent_round";
  const myPlayer = game.players.find((p) => p.userId === currentUserId);
  const myAbility = myPlayer?.ability ? ALL_ABILITIES[myPlayer.ability] : null;
  const isEliminated = myPlayer?.isEliminated ?? false;

  // Players sorted by speaking order
  const activePlayers = game.players
    .filter((p) => !p.isEliminated)
    .sort((a, b) => (a.speakingOrder ?? 99) - (b.speakingOrder ?? 99));

  const currentSpeaker = activePlayers[activeSpeakerIdx] ?? null;
  const isMyTurn = currentSpeaker?.userId === currentUserId;
  const maxTime = status === "discussion" ? game.discussionTimeLimit : game.votingTimeLimit;

  // Reset on phase change
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
        setActiveSpeakerIdx(0);
      }
    }
  }, [status]);

  // Sync hasVoted with server state on reconnect
  useEffect(() => {
    if (status === "voting" && myPlayer?.hasVoted) {
      setHasVoted(true);
    }
  }, [status, myPlayer?.hasVoted]);

  // Countdown timer — driven by server timestamps
  useEffect(() => {
    if (status !== "discussion" && status !== "voting") {
      setTimeLeft(0);
      return;
    }
    const startTime = status === "discussion" ? game.discussionStartedAt : game.votingStartedAt;
    const limit = status === "discussion" ? game.discussionTimeLimit : game.votingTimeLimit;
    if (!startTime || !limit) return;

    const update = () => setTimeLeft(Math.max(0, limit - Math.floor((Date.now() - startTime) / 1000)));
    update();
    const timer = setInterval(update, 500);
    return () => clearInterval(timer);
  }, [status, game.discussionStartedAt, game.votingStartedAt, game.discussionTimeLimit, game.votingTimeLimit]);

  // Auto-advance timer (host only, fires once at 0)
  useEffect(() => {
    if (!isHost || timeLeft !== 0 || autoAdvancedRef.current || maxTime === 0) return;
    if (status === "discussion") {
      autoAdvancedRef.current = true;
      startVoting(game.id).catch(() => { autoAdvancedRef.current = false; });
    }
  }, [timeLeft, isHost, status, game.id, maxTime]);

  // Auto-advance speaker every N seconds during discussion
  useEffect(() => {
    if (status !== "discussion" || !game.discussionStartedAt || activePlayers.length === 0) return;
    if (maxTime === 0) return;

    // Each player gets equal time
    const timePerPlayer = Math.floor(game.discussionTimeLimit / activePlayers.length);
    const elapsed = Math.floor((Date.now() - game.discussionStartedAt) / 1000);
    const idx = Math.min(Math.floor(elapsed / timePerPlayer), activePlayers.length - 1);
    setActiveSpeakerIdx(idx);
  }, [timeLeft, status, activePlayers.length, game.discussionStartedAt, game.discussionTimeLimit, maxTime]);

  const timePct = maxTime > 0 ? Math.max(0, Math.min(100, (timeLeft / maxTime) * 100)) : 0;
  const timerColor = timePct > 50 ? "bg-green-500" : timePct > 20 ? "bg-yellow-500" : "bg-red-500";

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
        toast({ title: "✅ Vote cast!", description: "Your vote is locked in." });
      }
    } finally {
      setVotingInProgress(false);
    }
  }

  async function handleUseAbility(abilityType: string, targetUserId?: string) {
    const result = await useAbility(game.id, abilityType, targetUserId);
    if (result?.error) toast({ title: "Error", description: result.error, variant: "destructive" });
    else toast({ title: "⚡ Ability activated!" });
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ── */}
      <header className="glass border-b border-white/10 px-4 py-2 flex-shrink-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            {/* Round badge */}
            <Badge variant="purple" className="text-xs flex-shrink-0">
              Round {game.roundNumber}
            </Badge>
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
              status === "discussion" ? "bg-green-400 animate-pulse" :
              status === "voting" ? "bg-red-400 animate-pulse" : "bg-yellow-400"
            }`} />
            <span className="font-bold text-white text-sm truncate">
              {status === "assigning" ? "🎭 Roles Assigned" :
               status === "discussion" ? "💬 Discussion" :
               status === "voting" ? "🗳️ Voting" : status}
            </span>
            {game.activeTwist && (
              <Badge variant="outline" className="text-xs border-white/20 text-white/50 hidden sm:flex">
                {game.activeTwist.icon} {game.activeTwist.name}
              </Badge>
            )}
          </div>
          {/* Timer */}
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
        {/* Timer bar */}
        {(status === "discussion" || status === "voting") && (
          <div className="max-w-6xl mx-auto mt-1.5">
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
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
        {/* ── Left: Game content ── */}
        <div className="lg:col-span-2 space-y-4 overflow-y-auto pb-4">

          {/* ── ASSIGNING ── */}
          {status === "assigning" && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-6">
              <div className="text-center mb-6">
                <div className="text-5xl mb-3">🎭</div>
                <h2 className="text-2xl font-bold text-white">Round {game.roundNumber} — Roles Assigned!</h2>
                <p className="text-white/50 mt-1">Your secret role is below. Don&apos;t reveal it!</p>
              </div>
              <WordReveal
                role={myPlayer?.role}
                wordShown={myPlayer?.wordShown}
                category={game.category}
                twist={game.activeTwist}
                ability={myAbility}
                memoryLoss={game.activeTwist?.type === "memory_loss"}
              />
              {isHost ? (
                <Button variant="game" size="lg" className="w-full mt-6" onClick={handleStartDiscussion}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Start Discussion →
                </Button>
              ) : (
                <p className="text-white/40 text-sm text-center mt-6 animate-pulse">
                  Waiting for host to start discussion...
                </p>
              )}
            </motion.div>
          )}

          {/* ── DISCUSSION ── */}
          {status === "discussion" && (
            <div className="space-y-3">

              {/* Speaking order — who talks now */}
              <div className="glass-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-white/70 flex items-center gap-2">
                    <Mic className="w-4 h-4 text-green-400" />
                    Speaking Order
                  </h3>
                  <span className="text-xs text-white/40">
                    {activeSpeakerIdx + 1} / {activePlayers.length}
                  </span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {activePlayers.map((p, idx) => {
                    const isCurrent = idx === activeSpeakerIdx;
                    const isDone = idx < activeSpeakerIdx;
                    const isMe = p.userId === currentUserId;
                    return (
                      <motion.div
                        key={p.userId}
                        animate={isCurrent ? { scale: 1.05 } : { scale: 1 }}
                        className={`flex-shrink-0 flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all min-w-[64px] ${
                          isCurrent
                            ? "border-green-500/60 bg-green-500/15 shadow-[0_0_12px_rgba(34,197,94,0.3)]"
                            : isDone
                            ? "border-white/5 bg-white/3 opacity-40"
                            : "border-white/10 bg-white/5"
                        }`}
                      >
                        <div className="relative">
                          <PlayerAvatar avatar={p.avatar} border={p.border} size="sm" />
                          {isCurrent && (
                            <span className="absolute -top-1 -right-1 text-xs">🎤</span>
                          )}
                          {isDone && (
                            <span className="absolute -top-1 -right-1 text-xs">✓</span>
                          )}
                        </div>
                        <p className={`text-[10px] font-medium text-center truncate w-full ${
                          isCurrent ? "text-green-300" : isMe ? "text-purple-300" : "text-white/60"
                        }`}>
                          {isMe ? "You" : p.displayName.split(" ")[0]}
                        </p>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                          isCurrent ? "bg-green-500/30 text-green-300" :
                          isDone ? "bg-white/10 text-white/30" :
                          "bg-white/10 text-white/40"
                        }`}>
                          {isCurrent ? "NOW" : isDone ? "DONE" : `#${idx + 1}`}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Current speaker callout */}
                <AnimatePresence mode="wait">
                  {currentSpeaker && (
                    <motion.div
                      key={currentSpeaker.userId}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className={`mt-3 p-3 rounded-xl border text-center ${
                        isMyTurn
                          ? "border-green-500/50 bg-green-500/10"
                          : "border-white/10 bg-white/5"
                      }`}
                    >
                      {isMyTurn ? (
                        <>
                          <p className="text-green-400 font-bold text-sm">🎤 It&apos;s YOUR turn to speak!</p>
                          <p className="text-white/50 text-xs mt-0.5">
                            Give a hint about the word without saying it directly
                          </p>
                        </>
                      ) : (
                        <p className="text-white/60 text-sm">
                          <span className="font-bold text-white">{currentSpeaker.displayName}</span> is speaking...
                          {currentSpeaker.userId === currentUserId ? "" : " 👂 Listen carefully"}
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* My role reminder */}
              <div className={`rounded-xl p-3 border flex items-center gap-3 ${
                myPlayer?.role === "impostor" || myPlayer?.role === "double_agent"
                  ? "border-red-500/30 bg-red-500/10"
                  : "border-green-500/20 bg-green-500/5"
              }`}>
                <span className="text-2xl flex-shrink-0">
                  {myPlayer?.role === "impostor" || myPlayer?.role === "double_agent" ? "😈" : "🕵️"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-white/40 text-[10px] uppercase tracking-widest">Your Role</p>
                  <p className="font-bold text-white text-sm capitalize">
                    {myPlayer?.role === "double_agent" ? "Double Agent" : myPlayer?.role ?? "..."}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  {myPlayer?.wordShown ? (
                    <>
                      <p className="text-white/40 text-[10px] uppercase tracking-widest">Your Word</p>
                      <p className="font-black text-white">{myPlayer.wordShown}</p>
                    </>
                  ) : (
                    <p className="text-white/40 text-xs italic">No word</p>
                  )}
                </div>
                {game.category && (
                  <Badge variant="outline" className="text-xs border-white/20 text-white/40 flex-shrink-0">
                    {game.category}
                  </Badge>
                )}
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

              {/* Host control */}
              {isHost && (
                <Button variant="game" size="sm" className="w-full" onClick={handleStartVoting}>
                  <Vote className="w-4 h-4 mr-2" />
                  End Discussion & Vote
                </Button>
              )}
            </div>
          )}

          {/* ── VOTING ── */}
          {status === "voting" && (
            <div className="space-y-4">
              {isEliminated ? (
                <div className="glass-card p-8 text-center">
                  <div className="text-5xl mb-3">☠️</div>
                  <h2 className="text-xl font-bold text-red-400 mb-2">You were eliminated!</h2>
                  <p className="text-white/50 text-sm">Watch the others vote...</p>
                </div>
              ) : (
                <div className="glass-card p-4">
                  <h2 className="font-bold text-white text-lg mb-1 flex items-center gap-2">
                    <Vote className="w-5 h-5 text-red-400" />
                    {hasVoted ? "Vote Cast ✅" : "Vote for the Impostor!"}
                  </h2>
                  <p className="text-white/50 text-sm mb-4">
                    {hasVoted
                      ? "Waiting for others to vote..."
                      : "Who do you think is faking it?"}
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

              {/* Vote progress */}
              <div className="glass-card p-4">
                <p className="text-white/50 text-xs uppercase tracking-widest mb-3">Votes Cast</p>
                <div className="flex gap-2 flex-wrap">
                  {activePlayers.map((p) => (
                    <div key={p.userId} className="flex items-center gap-1.5">
                      <PlayerAvatar avatar={p.avatar} size="sm" />
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                        p.hasVoted ? "bg-green-500/30 text-green-400" : "bg-white/10 text-white/30"
                      }`}>
                        {p.hasVoted ? "✓" : "·"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

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

        {/* ── Right: Chat ── */}
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

function VoteCard({ player, isSelected, hasVoted, isPending, onVote, isAnonymous }: {
  player: GamePlayerState; isSelected: boolean; hasVoted: boolean;
  isPending: boolean; onVote: () => void; isAnonymous: boolean;
}) {
  return (
    <motion.button
      whileHover={!hasVoted && !isPending ? { scale: 1.03 } : {}}
      whileTap={!hasVoted && !isPending ? { scale: 0.97 } : {}}
      onClick={!hasVoted && !isPending ? onVote : undefined}
      disabled={hasVoted || isPending}
      className={`p-4 rounded-xl border transition-all text-center w-full ${
        isSelected
          ? "border-red-500/70 bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.25)]"
          : hasVoted
          ? "border-white/10 bg-white/5 opacity-50 cursor-default"
          : "border-white/10 bg-white/5 hover:border-red-400/50 hover:bg-red-500/10 cursor-pointer"
      }`}
    >
      <PlayerAvatar avatar={player.avatar} border={player.border} size="md" className="mx-auto mb-2" />
      <p className="text-white text-sm font-medium truncate">{player.displayName}</p>
      {isSelected && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mt-1.5">
          <Badge variant="impostor" className="text-[10px]">YOUR VOTE</Badge>
        </motion.div>
      )}
      {!isAnonymous && player.votesReceived !== undefined && player.votesReceived > 0 && (
        <p className="mt-1 text-xs text-red-400 font-bold">{player.votesReceived} 🗳️</p>
      )}
      {player.hasVoted && !isSelected && (
        <p className="mt-1 text-[10px] text-white/30">voted ✓</p>
      )}
    </motion.button>
  );
}
