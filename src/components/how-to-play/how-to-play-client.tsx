"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ChevronRight, ChevronLeft } from "lucide-react";

const STEPS = [
  {
    emoji: "🎮",
    title: "Join or Create a Room",
    color: "from-purple-500 to-indigo-500",
    content: [
      "Create a private room and share the 6-character code with friends.",
      "You need at least 4 players to start — up to 12 can join!",
      "The host sets the discussion time, voting time, number of impostors, and which twists are enabled.",
    ],
    tip: "Share the room code in a group chat so everyone can join quickly!",
  },
  {
    emoji: "🎭",
    title: "Roles Are Assigned",
    color: "from-red-500 to-orange-500",
    content: [
      "At the start of each round, one player is secretly chosen as the Impostor.",
      "All innocent players receive a Secret Word (e.g. 'Sushi', 'Volcano', 'Dragon').",
      "The Impostor receives NO word — they must pretend they know it!",
      "Some players may also receive a Special Ability card — one-time powers you can use strategically.",
    ],
    tip: "Check your role carefully before discussion starts. Memorize your word!",
  },
  {
    emoji: "🌪️",
    title: "The Twist Activates",
    color: "from-yellow-500 to-orange-500",
    content: [
      "Every round, a random Twist changes the rules! There are 15 unique twists.",
      "🔄 Reverse Round — Impostor knows the word; one Innocent doesn't!",
      "🤫 Silent Round — Only emojis allowed during discussion.",
      "🧠 Memory Loss — Your word disappears after 10 seconds. Memorize it!",
      "💣 Time Bomb — One player has limited time to defend themselves.",
      "...and 11 more! No two rounds ever play the same way.",
    ],
    tip: "The twist is revealed when discussion starts — be ready to adapt!",
  },
  {
    emoji: "💬",
    title: "Discussion Phase — Speaking Turns",
    color: "from-green-500 to-teal-500",
    content: [
      "Players take turns giving a hint about the secret word — without saying it directly!",
      "Each player has a speaking slot shown at the top of the screen.",
      "The game automatically tracks whose turn it is based on the timer.",
      "🎤 When it's YOUR turn — give one clear hint. Be specific enough to prove you know the word, but vague enough not to make it obvious!",
      "👂 When it's someone else's turn — listen carefully for inconsistencies.",
      "After all players speak, the host can end discussion early or wait for the timer.",
    ],
    tip: "Impostors: give confident but vague hints. Reference the category, not specifics!",
  },
  {
    emoji: "🗳️",
    title: "Voting Phase",
    color: "from-red-500 to-pink-500",
    content: [
      "After discussion, everyone votes for who they think is the Impostor.",
      "You can also Pass (skip) your vote if you're unsure.",
      "The player with the most votes is eliminated.",
      "Tie? Nobody gets eliminated — round ends with no elimination.",
      "In non-anonymous rooms, you can see live vote counts as they come in!",
    ],
    tip: "Don't vote too fast — wait to see where others are leaning first!",
  },
  {
    emoji: "📊",
    title: "The Reveal",
    color: "from-blue-500 to-cyan-500",
    content: [
      "After voting, all roles are revealed — Impostors exposed!",
      "The secret word is shown along with who received what word.",
      "Win conditions:",
      "✅ Innocents win — if the Impostor is eliminated.",
      "😈 Impostor wins — if they survive and outnumber innocents.",
      "Everyone earns XP and coins based on their performance.",
    ],
    tip: "Even if you lose, you still earn XP and coins for participating!",
  },
  {
    emoji: "⚡",
    title: "Special Abilities",
    color: "from-yellow-400 to-amber-500",
    content: [
      "Some players receive a single-use Ability card each round.",
      "🔍 Category Spy — reveal only a player's category to everyone.",
      "🛡️ Shield — protect yourself from elimination once.",
      "2️⃣ Double Vote — your vote counts twice.",
      "🎤 Spotlight — force another player to speak first.",
      "❄️ Time Freeze — freeze another player's speaking timer.",
      "...and 6 more! Abilities appear in your role card at the start of each round.",
    ],
    tip: "Save abilities for the right moment — timing is everything!",
  },
  {
    emoji: "🏆",
    title: "Progression & Rewards",
    color: "from-yellow-500 to-orange-500",
    content: [
      "Every game earns you XP and Coins.",
      "Level up to unlock new avatars, borders, titles, emotes, and vote effects.",
      "Complete weekly missions for bonus rewards.",
      "Claim your daily login reward every day!",
      "Unlock achievements for special milestones.",
      "In Ranked Mode, climb from Bronze → Silver → Gold → Platinum → Diamond → Master!",
    ],
    tip: "All cosmetics are purely visual — no pay-to-win. Ever!",
  },
];

const QUICK_RULES = [
  { icon: "✅", text: "You CAN give a hint about what the word is related to" },
  { icon: "✅", text: "You CAN say the category (e.g. 'It's an animal')" },
  { icon: "✅", text: "You CAN ask others questions" },
  { icon: "❌", text: "You CANNOT say the word directly" },
  { icon: "❌", text: "You CANNOT spell the word or say it in another language" },
  { icon: "❌", text: "You CANNOT point directly at the Impostor" },
  { icon: "🎭", text: "Impostors SHOULD give hints to blend in — but keep them vague!" },
];

export function HowToPlayClient() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [showQuickRules, setShowQuickRules] = useState(false);

  const current = STEPS[step];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass border-b border-white/10 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Button variant="ghost" size="icon-sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="font-bold text-white">How to Play</h1>
          <Button
            variant="glass"
            size="sm"
            onClick={() => setShowQuickRules(!showQuickRules)}
          >
            📋 Rules
          </Button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Quick Rules Panel */}
        <AnimatePresence>
          {showQuickRules && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="glass-card p-5 mb-6 overflow-hidden"
            >
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                📋 Quick Rules Reference
              </h3>
              <div className="space-y-2">
                {QUICK_RULES.map((rule, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-3 text-sm"
                  >
                    <span className="text-lg flex-shrink-0">{rule.icon}</span>
                    <span className="text-white/70">{rule.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step indicator */}
        <div className="flex items-center gap-1.5 mb-8 justify-center">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`transition-all rounded-full ${
                i === step
                  ? "w-8 h-2 bg-purple-500"
                  : i < step
                  ? "w-2 h-2 bg-purple-500/50"
                  : "w-2 h-2 bg-white/20"
              }`}
            />
          ))}
        </div>

        {/* Step card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="glass-card p-6 mb-6"
          >
            {/* Step header */}
            <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r ${current.color} mb-5`}>
              <span className="text-2xl">{current.emoji}</span>
              <div>
                <p className="text-white/60 text-[10px] uppercase tracking-widest">
                  Step {step + 1} of {STEPS.length}
                </p>
                <h2 className="font-black text-white text-lg leading-tight">{current.title}</h2>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-3 mb-5">
              {current.content.map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-start gap-2 text-sm text-white/80"
                >
                  <span className="text-white/20 mt-0.5 flex-shrink-0">•</span>
                  <span>{line}</span>
                </motion.div>
              ))}
            </div>

            {/* Tip */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 flex items-start gap-2">
              <span className="text-lg flex-shrink-0">💡</span>
              <p className="text-yellow-300/90 text-sm">{current.tip}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="flex-1"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              variant="game"
              onClick={() => setStep(step + 1)}
              className="flex-1"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              variant="success"
              onClick={() => router.push("/dashboard")}
              className="flex-1"
            >
              Ready to Play! 🎮
            </Button>
          )}
        </div>

        {/* Twists preview */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 glass-card p-5"
          >
            <h3 className="font-bold text-white mb-3 text-sm">All 15 Twists</h3>
            <div className="flex flex-wrap gap-2">
              {[
                "🔄 Reverse Round", "🕵️ Double Agent", "🤫 Silent Round",
                "🎭 Fake Hint", "🍀 Lucky Guess", "👁️ Hidden Category",
                "↔️ Swap Roles", "🧠 Memory Loss", "🤝 Secret Alliance",
                "💣 Time Bomb", "🌪️ Chaos Round", "🧬 Word Mutation",
                "👯 Twin Mode", "🔇 Mute Curse", "📦 Mystery Box",
              ].map((t) => (
                <Badge key={t} variant="outline" className="text-xs border-white/20 text-white/60">
                  {t}
                </Badge>
              ))}
            </div>
          </motion.div>
        )}

        {/* Example game scenario */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 glass-card p-5"
          >
            <h3 className="font-bold text-white mb-3 text-sm">📖 Example Round</h3>
            <div className="space-y-2 text-sm text-white/70">
              <p>Secret word: <span className="text-white font-bold">Dragon</span> (Category: Fantasy)</p>
              <div className="space-y-1.5 mt-3">
                {[
                  { name: "Player 1", hint: '"It breathes fire and lives in caves."', isImpostor: false },
                  { name: "Player 2 😈", hint: '"It\'s... a legendary creature... that\'s very powerful?"', isImpostor: true },
                  { name: "Player 3", hint: '"You\'d find it in a medieval fantasy story."', isImpostor: false },
                  { name: "Player 4", hint: '"It has wings and scales."', isImpostor: false },
                ].map((p) => (
                  <div key={p.name} className={`flex gap-2 p-2 rounded-lg ${p.isImpostor ? "bg-red-500/10 border border-red-500/20" : "bg-white/5"}`}>
                    <span className={`font-semibold flex-shrink-0 ${p.isImpostor ? "text-red-400" : "text-white"}`}>
                      {p.name}:
                    </span>
                    <span className="italic">{p.hint}</span>
                    {p.isImpostor && <span className="text-red-400 text-xs ml-auto">(Impostor!)</span>}
                  </div>
                ))}
              </div>
              <p className="text-white/50 text-xs mt-2 italic">
                Notice how the Impostor&apos;s hint is vague and generic — no specific details!
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
