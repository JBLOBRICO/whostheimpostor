"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { joinRoom } from "@/lib/actions/room";
import { useToast } from "@/hooks/use-toast";
import { X, Users, Hash } from "lucide-react";

interface JoinRoomModalProps {
  open: boolean;
  onClose: () => void;
}

export function JoinRoomModal({ open, onClose }: JoinRoomModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleJoin() {
    if (code.length < 6) {
      setError("Enter a valid 6-character room code");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const result = await joinRoom(code.toUpperCase());
      if (result.error) {
        setError(result.error);
      } else if (result.roomCode) {
        toast({ title: "Joined room!", description: `Welcome to room ${result.roomCode}`, variant: "success" });
        router.push(`/room/${result.roomCode}`);
        onClose();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm glass-card p-6 z-10"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                Join Room
              </h2>
              <Button variant="ghost" size="icon-sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <Input
                label="Room Code"
                placeholder="ABCD12"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={6}
                icon={<Hash className="w-4 h-4" />}
                error={error}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                className="text-center text-2xl font-bold tracking-widest uppercase"
              />

              <p className="text-white/40 text-xs text-center">
                Ask the room host for the 6-character code
              </p>

              <Button
                variant="success"
                size="lg"
                className="w-full"
                loading={loading}
                onClick={handleJoin}
                disabled={code.length < 6}
              >
                Join Game →
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
