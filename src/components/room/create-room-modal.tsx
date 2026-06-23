"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createRoom } from "@/lib/actions/room";
import { useToast } from "@/hooks/use-toast";
import { X, Plus, Settings2 } from "lucide-react";
import { GameMode } from "@/types/game";

interface CreateRoomModalProps {
  open: boolean;
  onClose: () => void;
}

const GAME_MODES: Array<{ value: GameMode; label: string; icon: string; desc: string }> = [
  { value: "classic", label: "Classic", icon: "🎭", desc: "Standard rules" },
  { value: "chaos", label: "Chaos", icon: "🌪️", desc: "Random twists every round" },
  { value: "ranked", label: "Ranked", icon: "🏆", desc: "Competitive play" },
  { value: "custom", label: "Custom", icon: "⚙️", desc: "Your rules" },
];

export function CreateRoomModal({ open, onClose }: CreateRoomModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [settings, setSettings] = useState({
    name: "",
    gameMode: "classic" as GameMode,
    maxPlayers: 8,
    discussionTime: 120,
    votingTime: 60,
    numImpostors: 1,
    anonymousVoting: false,
    enableAbilities: true,
    enableTwists: true,
  });

  async function handleCreate() {
    setLoading(true);
    try {
      const result = await createRoom(settings);
      if (result.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      } else if (result.roomCode) {
        toast({ title: "Room created!", description: `Code: ${result.roomCode}`, variant: "success" });
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
            className="relative w-full max-w-md glass-card p-6 z-10 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-400" />
                Create Room
              </h2>
              <Button variant="ghost" size="icon-sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-5">
              {/* Room Name */}
              <Input
                label="Room Name"
                placeholder="My Awesome Room"
                value={settings.name}
                onChange={(e) => setSettings((p) => ({ ...p, name: e.target.value }))}
                maxLength={30}
              />

              {/* Game Mode */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Game Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  {GAME_MODES.map((mode) => (
                    <button
                      key={mode.value}
                      onClick={() => setSettings((p) => ({ ...p, gameMode: mode.value }))}
                      className={`p-3 rounded-xl border transition-all text-left ${
                        settings.gameMode === mode.value
                          ? "border-purple-500/60 bg-purple-500/20 text-white"
                          : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                      }`}
                    >
                      <div className="text-lg mb-0.5">{mode.icon}</div>
                      <div className="font-semibold text-sm">{mode.label}</div>
                      <div className="text-xs opacity-70">{mode.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Max Players */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Max Players: {settings.maxPlayers}
                </label>
                <input
                  type="range"
                  min={4}
                  max={12}
                  value={settings.maxPlayers}
                  onChange={(e) => setSettings((p) => ({ ...p, maxPlayers: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-white/30 mt-1">
                  <span>4</span><span>12</span>
                </div>
              </div>

              {/* Advanced Settings Toggle */}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-white/50 text-sm hover:text-white/70 transition-colors"
              >
                <Settings2 className="w-4 h-4" />
                {showAdvanced ? "Hide" : "Show"} Advanced Settings
              </button>

              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    {/* Discussion Time */}
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">
                        Discussion Time: {settings.discussionTime}s
                      </label>
                      <input
                        type="range"
                        min={30}
                        max={300}
                        step={15}
                        value={settings.discussionTime}
                        onChange={(e) => setSettings((p) => ({ ...p, discussionTime: parseInt(e.target.value) }))}
                        className="w-full"
                      />
                    </div>

                    {/* Voting Time */}
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">
                        Voting Time: {settings.votingTime}s
                      </label>
                      <input
                        type="range"
                        min={15}
                        max={120}
                        step={15}
                        value={settings.votingTime}
                        onChange={(e) => setSettings((p) => ({ ...p, votingTime: parseInt(e.target.value) }))}
                        className="w-full"
                      />
                    </div>

                    {/* Num Impostors */}
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">
                        Impostors: {settings.numImpostors}
                      </label>
                      <input
                        type="range"
                        min={1}
                        max={3}
                        value={settings.numImpostors}
                        onChange={(e) => setSettings((p) => ({ ...p, numImpostors: parseInt(e.target.value) }))}
                        className="w-full"
                      />
                    </div>

                    {/* Toggles */}
                    <div className="space-y-2">
                      {[
                        { key: "anonymousVoting", label: "Anonymous Voting" },
                        { key: "enableAbilities", label: "Special Abilities" },
                        { key: "enableTwists", label: "Round Twists" },
                      ].map((toggle) => (
                        <label key={toggle.key} className="flex items-center justify-between cursor-pointer">
                          <span className="text-sm text-white/70">{toggle.label}</span>
                          <div
                            className={`w-10 h-5 rounded-full transition-colors relative ${
                              settings[toggle.key as keyof typeof settings]
                                ? "bg-purple-500"
                                : "bg-white/20"
                            }`}
                            onClick={() =>
                              setSettings((p) => ({
                                ...p,
                                [toggle.key]: !p[toggle.key as keyof typeof settings],
                              }))
                            }
                          >
                            <div
                              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                                settings[toggle.key as keyof typeof settings]
                                  ? "translate-x-5"
                                  : "translate-x-0.5"
                              }`}
                            />
                          </div>
                        </label>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                variant="game"
                size="lg"
                className="w-full"
                loading={loading}
                onClick={handleCreate}
              >
                Create Room 🚀
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
