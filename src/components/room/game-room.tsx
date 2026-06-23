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

const POLL_INTERVAL_MS = 2000;
const MESSAGE_POLL_INTERVAL_MS = 1500;

export function GameRoom({ roomId, roomCode, currentUserId }: GameRoomProps) {
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

  const pollRoomState = useCallback(async () => {
    try {
      const res = await fetch(`/api/room/${roomId}/state`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (isMountedRef.current && data.roomState) {
        setRoomState(data.roomState);
      }
    } catch {
      // silently handle network errors
    }
  }, [roomId, setRoomState]);

  const pollMessages = useCallback(async () => {
    try {
      const url = `/api/room/${roomId}/messages${
        lastMessageTimestamp ? `?since=${lastMessageTimestamp}` : ""
      }`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (isMountedRef.current && data.messages?.length > 0) {
        const msgs = data.messages as ChatMessage[];
        msgs.forEach((m) => addMessage(m));
        setLastMessageTimestamp(msgs[msgs.length - 1].createdAt);
      }
    } catch {
      // silently handle
    }
  }, [roomId, lastMessageTimestamp, addMessage, setLastMessageTimestamp]);

  // Load initial messages
  useEffect(() => {
    fetch(`/api/room/${roomId}/messages`)
      .then((r) => r.json())
      .then((data) => {
        if (data.messages?.length > 0) {
          setMessages(data.messages);
          setLastMessageTimestamp(data.messages[data.messages.length - 1].createdAt);
        }
      })
      .catch(() => {});
  }, [roomId, setMessages, setLastMessageTimestamp]);

  // Start polling
  useEffect(() => {
    isMountedRef.current = true;
    pollRoomState();

    pollTimerRef.current = setInterval(pollRoomState, POLL_INTERVAL_MS);
    msgPollTimerRef.current = setInterval(pollMessages, MESSAGE_POLL_INTERVAL_MS);

    return () => {
      isMountedRef.current = false;
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (msgPollTimerRef.current) clearInterval(msgPollTimerRef.current);
      reset();
    };
  }, [pollRoomState, pollMessages, reset]);

  // Adjust poll rate based on game phase
  useEffect(() => {
    const status = roomState?.currentGame?.status;
    const interval = status === "voting" || status === "discussion" ? 1500 : POLL_INTERVAL_MS;

    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = setInterval(pollRoomState, interval);
  }, [roomState?.currentGame?.status, pollRoomState]);

  if (!roomState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"
        />
        <span className="ml-3 text-white/60">Loading room...</span>
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
          <motion.div
            key="lobby"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <RoomLobby
              roomState={roomState}
              currentUserId={currentUserId}
              messages={messages}
              roomId={roomId}
            />
          </motion.div>
        ) : isRevealing ? (
          <motion.div
            key="reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <GameReveal
              roomState={roomState}
              currentUserId={currentUserId}
              roomId={roomId}
            />
          </motion.div>
        ) : (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <GamePhase
              roomState={roomState}
              currentUserId={currentUserId}
              messages={messages}
              roomId={roomId}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Twist reveal overlay */}
      <TwistRevealOverlay
        twist={roomState.currentGame?.activeTwist ?? null}
        visible={showTwistReveal}
      />
    </div>
  );
}
