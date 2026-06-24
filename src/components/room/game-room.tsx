"use client";

import { useEffect, useCallback, useRef } from "react";
import { useGameStore } from "@/store/game-store";
import { RoomLobby } from "@/components/game/room-lobby";
import { GamePhase } from "@/components/game/game-phase";
import { GameReveal } from "@/components/game/game-reveal";
import { TwistRevealOverlay } from "@/components/game/twist-reveal-overlay";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMessage } from "@/types/game";

interface GameRoomProps {
  roomId: string;
  roomCode: string;
  currentUserId: string;
}

const POLL_INTERVAL_LOBBY = 2500;
const POLL_INTERVAL_ACTIVE = 1800;
const MSG_POLL_INTERVAL = 1500;

export function GameRoom({ roomId, currentUserId }: GameRoomProps) {
  const {
    roomState,
    setRoomState,
    messages,
    setMessages,
    addMessage,
    lastMessageTimestamp,
    setLastMessageTimestamp,
    showTwistReveal,
    reset,
  } = useGameStore();

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const msgPollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const seenMessageIdsRef = useRef<Set<string>>(new Set());
  // Track last timestamp as ref to avoid stale closure in poll
  const lastMsgTsRef = useRef<number>(0);

  // Keep ref in sync
  useEffect(() => {
    lastMsgTsRef.current = lastMessageTimestamp;
  }, [lastMessageTimestamp]);

  const pollRoomState = useCallback(async () => {
    try {
      const res = await fetch(`/api/room/${roomId}/state`, { cache: "no-store" });
      if (!res.ok || !isMountedRef.current) return;
      const data = await res.json();
      if (data.roomState) setRoomState(data.roomState);
    } catch {
      // network error — silently retry
    }
  }, [roomId, setRoomState]);

  const pollMessages = useCallback(async () => {
    try {
      const ts = lastMsgTsRef.current;
      const url = ts
        ? `/api/room/${roomId}/messages?since=${ts}`
        : `/api/room/${roomId}/messages`;

      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok || !isMountedRef.current) return;

      const data = await res.json();
      const newMsgs: ChatMessage[] = (data.messages ?? []).filter(
        (m: ChatMessage) => !seenMessageIdsRef.current.has(m.id)
      );

      if (newMsgs.length > 0) {
        newMsgs.forEach((m) => {
          seenMessageIdsRef.current.add(m.id);
          addMessage(m);
        });
        setLastMessageTimestamp(newMsgs[newMsgs.length - 1].createdAt);
      }
    } catch {
      // silently handle
    }
  }, [roomId, addMessage, setLastMessageTimestamp]);

  // Initial load — fetch all messages once
  useEffect(() => {
    isMountedRef.current = true;

    fetch(`/api/room/${roomId}/messages`)
      .then((r) => r.json())
      .then((data) => {
        if (!isMountedRef.current) return;
        const msgs: ChatMessage[] = data.messages ?? [];
        msgs.forEach((m) => seenMessageIdsRef.current.add(m.id));
        setMessages(msgs);
        if (msgs.length > 0) {
          setLastMessageTimestamp(msgs[msgs.length - 1].createdAt);
        }
      })
      .catch(() => {});

    // Initial state fetch
    pollRoomState();

    return () => {
      isMountedRef.current = false;
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (msgPollTimerRef.current) clearInterval(msgPollTimerRef.current);
      reset();
    };
  }, [roomId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Start/restart polling — adjust speed based on game phase
  useEffect(() => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    if (msgPollTimerRef.current) clearInterval(msgPollTimerRef.current);

    const status = roomState?.currentGame?.status;
    const isActive = status === "discussion" || status === "voting";
    const stateInterval = isActive ? POLL_INTERVAL_ACTIVE : POLL_INTERVAL_LOBBY;

    pollTimerRef.current = setInterval(pollRoomState, stateInterval);
    msgPollTimerRef.current = setInterval(pollMessages, MSG_POLL_INTERVAL);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (msgPollTimerRef.current) clearInterval(msgPollTimerRef.current);
    };
  }, [roomState?.currentGame?.status, pollRoomState, pollMessages]);

  if (!roomState) {
    return (
      <div className="min-h-screen flex items-center justify-center gap-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-7 h-7 border-2 border-purple-500 border-t-transparent rounded-full"
        />
        <span className="text-white/50 text-sm">Connecting to room...</span>
      </div>
    );
  }

  const gameStatus = roomState.currentGame?.status;
  const isInGame = roomState.status === "playing" && roomState.currentGame;
  const isRevealing = gameStatus === "revealing";

  return (
    <div className="min-h-screen">
      <AnimatePresence mode="wait">
        {!isInGame ? (
          <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <RoomLobby
              roomState={roomState}
              currentUserId={currentUserId}
              messages={messages}
              roomId={roomId}
            />
          </motion.div>
        ) : isRevealing ? (
          <motion.div key="reveal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <GameReveal
              roomState={roomState}
              currentUserId={currentUserId}
              roomId={roomId}
            />
          </motion.div>
        ) : (
          <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <GamePhase
              roomState={roomState}
              currentUserId={currentUserId}
              messages={messages}
              roomId={roomId}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <TwistRevealOverlay
        twist={roomState.currentGame?.activeTwist ?? null}
        visible={showTwistReveal}
      />
    </div>
  );
}
