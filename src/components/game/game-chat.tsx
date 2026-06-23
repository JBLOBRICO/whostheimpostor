"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMessage } from "@/types/game";
import { PlayerAvatar } from "@/components/game/player-avatar";
import { cn } from "@/lib/utils";
import { Send, Smile } from "lucide-react";

const QUICK_CHAT = [
  "I'm not the Impostor!", "Suspicious... 🤔", "Trust me!", "That's a lie!",
  "I saw something...", "Vote them out!", "I agree", "Wait, hear me out",
];

const EMOJIS = ["😂", "🤔", "😱", "😈", "🤫", "👀", "🎭", "🕵️", "✌️", "👑", "🔥", "❄️"];

interface GameChatProps {
  messages: ChatMessage[];
  roomId: string;
  currentUserId: string;
  silentRound?: boolean;
  className?: string;
}

export function GameChat({
  messages,
  roomId,
  currentUserId,
  silentRound = false,
  className,
}: GameChatProps) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [showQuickChat, setShowQuickChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (content: string, type: "text" | "emoji" | "quick_chat" = "text") => {
      if (!content.trim() || sending) return;
      setSending(true);
      try {
        await fetch(`/api/room/${roomId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, type }),
        });
        setInput("");
        setShowEmojis(false);
        setShowQuickChat(false);
      } catch {
        // ignore
      } finally {
        setSending(false);
      }
    },
    [roomId, sending]
  );

  function handleSend() {
    if (silentRound) {
      return; // only emojis allowed
    }
    sendMessage(input);
  }

  return (
    <div className={cn("glass-card flex flex-col overflow-hidden", className)}>
      <div className="p-3 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white/70">Chat</h3>
        {silentRound && (
          <span className="text-xs text-yellow-400 flex items-center gap-1">
            🤫 Silent Round — Emojis Only
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-2",
                msg.userId === currentUserId ? "flex-row-reverse" : "flex-row"
              )}
            >
              <PlayerAvatar avatar={msg.avatar} size="sm" />
              <div
                className={cn(
                  "max-w-[75%] rounded-xl px-3 py-2",
                  msg.type === "system"
                    ? "bg-white/5 text-white/50 text-xs italic mx-auto"
                    : msg.userId === currentUserId
                    ? "bg-purple-600/60 text-white ml-auto"
                    : "bg-white/10 text-white"
                )}
              >
                {msg.userId !== currentUserId && msg.type !== "system" && (
                  <p className="text-xs text-white/50 mb-0.5 font-medium">{msg.displayName}</p>
                )}
                <p className={cn("text-sm", msg.type === "emoji" && "text-2xl")}>{msg.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Emoji picker */}
      <AnimatePresence>
        {showEmojis && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-2 border-t border-white/10 flex flex-wrap gap-1.5"
          >
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => sendMessage(emoji, "emoji")}
                className="text-xl hover:scale-125 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick chat */}
      <AnimatePresence>
        {showQuickChat && !silentRound && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-2 border-t border-white/10 flex flex-wrap gap-1.5"
          >
            {QUICK_CHAT.map((msg) => (
              <button
                key={msg}
                onClick={() => sendMessage(msg, "quick_chat")}
                className="text-xs bg-white/10 hover:bg-white/20 rounded-lg px-2 py-1 text-white/70 transition-colors"
              >
                {msg}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="p-3 border-t border-white/10">
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowEmojis(!showEmojis);
              setShowQuickChat(false);
            }}
            className="text-white/40 hover:text-white/60 transition-colors"
          >
            <Smile className="w-5 h-5" />
          </button>
          {!silentRound && (
            <button
              onClick={() => {
                setShowQuickChat(!showQuickChat);
                setShowEmojis(false);
              }}
              className="text-white/40 hover:text-white/60 transition-colors text-xs"
            >
              💬
            </button>
          )}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={silentRound ? "Use emojis only →" : "Say something..."}
            disabled={silentRound || sending}
            maxLength={200}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending || silentRound}
            className="text-purple-400 hover:text-purple-300 disabled:opacity-30 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
