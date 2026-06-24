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
  currentUserAvatar?: string;
  currentUserName?: string;
  silentRound?: boolean;
  className?: string;
}

export function GameChat({
  messages,
  roomId,
  currentUserId,
  currentUserAvatar = "default",
  currentUserName = "You",
  silentRound = false,
  className,
}: GameChatProps) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [showQuickChat, setShowQuickChat] = useState(false);
  // Optimistic messages shown instantly while real ones are being fetched
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false); // use ref to avoid stale closures

  // Merge real + optimistic, dedup by id
  const seenIds = new Set(messages.map((m) => m.id));
  const filteredOptimistic = optimisticMessages.filter((m) => !seenIds.has(m.id));
  const allMessages = [...messages, ...filteredOptimistic].sort((a, b) => a.createdAt - b.createdAt);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages.length]);

  // Clean up optimistic messages that have been confirmed by server
  useEffect(() => {
    if (optimisticMessages.length === 0) return;
    setOptimisticMessages((prev) => prev.filter((m) => !seenIds.has(m.id)));
  }, [messages]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendMessage = useCallback(
    async (content: string, type: "text" | "emoji" | "quick_chat" = "text") => {
      if (!content.trim() || sendingRef.current) return;
      sendingRef.current = true;
      setSending(true);

      // Optimistic update — show message immediately with real avatar
      const tempId = `temp-${Date.now()}`;
      const optimistic: ChatMessage = {
        id: tempId,
        userId: currentUserId,
        displayName: currentUserName,
        avatar: currentUserAvatar,
        content,
        type,
        createdAt: Date.now(),
      };
      setOptimisticMessages((prev) => [...prev, optimistic]);
      setInput("");
      setShowEmojis(false);
      setShowQuickChat(false);

      try {
        const res = await fetch(`/api/room/${roomId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, type }),
        });

        if (!res.ok) {
          // Remove optimistic message on failure
          setOptimisticMessages((prev) => prev.filter((m) => m.id !== tempId));
          if (res.status === 429) {
            // Rate limited — restore input
            setInput(content);
          }
        }
      } catch {
        setOptimisticMessages((prev) => prev.filter((m) => m.id !== tempId));
        setInput(content);
      } finally {
        sendingRef.current = false;
        setSending(false);
      }
    },
    [roomId, currentUserId]
  );

  function handleSend() {
    if (silentRound || !input.trim()) return;
    sendMessage(input.trim());
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className={cn("glass-card flex flex-col overflow-hidden", className)}>
      {/* Header */}
      <div className="p-3 border-b border-white/10 flex items-center justify-between flex-shrink-0">
        <h3 className="text-sm font-semibold text-white/70">Chat</h3>
        {silentRound && (
          <span className="text-xs text-yellow-400 flex items-center gap-1">
            🤫 Emojis Only
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {allMessages.length === 0 && (
          <p className="text-white/20 text-xs text-center py-4">No messages yet. Say something!</p>
        )}
        <AnimatePresence initial={false}>
          {allMessages.map((msg) => {
            const isMe = msg.userId === currentUserId;
            const isOptimistic = msg.id.startsWith("temp-");
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: isOptimistic ? 0.7 : 1, y: 0, scale: 1 }}
                transition={{ duration: 0.15 }}
                className={cn("flex gap-2", isMe ? "flex-row-reverse" : "flex-row")}
              >
                {!isMe && <PlayerAvatar avatar={msg.avatar} size="sm" className="flex-shrink-0 mt-1" />}
                <div
                  className={cn(
                    "max-w-[78%] rounded-2xl px-3 py-2 break-words",
                    msg.type === "system"
                      ? "bg-white/5 text-white/40 text-xs italic mx-auto text-center"
                      : isMe
                      ? "bg-purple-600 text-white rounded-tr-sm"
                      : "bg-white/10 text-white rounded-tl-sm"
                  )}
                >
                  {!isMe && msg.type !== "system" && (
                    <p className="text-[10px] text-white/50 mb-0.5 font-semibold">{msg.displayName}</p>
                  )}
                  <p className={cn("text-sm leading-relaxed", msg.type === "emoji" && "text-2xl leading-none")}>
                    {msg.content}
                  </p>
                </div>
              </motion.div>
            );
          })}
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
            className="border-t border-white/10 p-2 flex flex-wrap gap-1.5 flex-shrink-0"
          >
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => sendMessage(emoji, "emoji")}
                className="text-xl hover:scale-125 transition-transform leading-none"
                type="button"
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
            className="border-t border-white/10 p-2 flex flex-wrap gap-1.5 flex-shrink-0"
          >
            {QUICK_CHAT.map((qc) => (
              <button
                key={qc}
                onClick={() => sendMessage(qc, "quick_chat")}
                className="text-xs bg-white/10 hover:bg-white/20 rounded-lg px-2 py-1 text-white/70 transition-colors"
                type="button"
              >
                {qc}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="p-2.5 border-t border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
          <button
            type="button"
            onClick={() => { setShowEmojis(!showEmojis); setShowQuickChat(false); }}
            className="text-white/40 hover:text-white/70 transition-colors flex-shrink-0"
          >
            <Smile className="w-4 h-4" />
          </button>
          {!silentRound && (
            <button
              type="button"
              onClick={() => { setShowQuickChat(!showQuickChat); setShowEmojis(false); }}
              className="text-white/40 hover:text-white/70 transition-colors text-sm flex-shrink-0"
            >
              💬
            </button>
          )}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={silentRound ? "Emojis only 👆" : "Say something..."}
            disabled={silentRound || sending}
            maxLength={200}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 outline-none disabled:opacity-40 min-w-0"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || sending || silentRound}
            className="text-purple-400 hover:text-purple-300 disabled:opacity-25 transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
