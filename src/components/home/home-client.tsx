"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

const FEATURES = [
  { icon: "🎭", title: "15 Unique Twists", desc: "Every round plays differently with game-changing twist mechanics" },
  { icon: "⚡", title: "Special Abilities", desc: "Strategic single-use powers that change how you play" },
  { icon: "🏆", title: "Ranked Mode", desc: "Climb from Bronze to Master with competitive matchmaking" },
  { icon: "🎨", title: "Rich Cosmetics", desc: "Unlock avatars, borders, effects and titles as you level up" },
  { icon: "📅", title: "Daily Events", desc: "Fresh global modifiers every day for bonus rewards" },
  { icon: "🌐", title: "No Download", desc: "Play instantly in your browser — no installs, no accounts on iOS" },
];

const TWISTS_PREVIEW = [
  "🔄 Reverse Round", "🕵️ Double Agent", "🤫 Silent Round", "🎭 Fake Hint",
  "🍀 Lucky Guess", "👁️ Hidden Category", "↔️ Swap Roles", "🧠 Memory Loss",
  "🤝 Secret Alliance", "💣 Time Bomb", "🌪️ Chaos Round", "🧬 Word Mutation",
  "👯 Twin Mode", "🔇 Mute Curse", "📦 Mystery Box",
];

export function HomeClient() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 glass border-b border-white/10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <span className="text-2xl">🕵️</span>
          <span className="font-bold text-lg gradient-text">Who&apos;s the Impostor</span>
          <Badge variant="purple" className="text-xs">Twist Edition</Badge>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <Button variant="ghost" onClick={() => router.push("/login")}>
            Sign In
          </Button>
          <Button variant="game" onClick={() => router.push("/register")}>
            Play Now
          </Button>
        </motion.div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-6 text-7xl animate-float">🕵️</div>
          <h1 className="text-5xl md:text-7xl font-black mb-4">
            <span className="gradient-text">Who&apos;s the</span>
            <br />
            <span className="text-white">Impostor?</span>
          </h1>
          <p className="text-xl text-white/60 mb-3 max-w-xl mx-auto font-medium">
            The social deduction game where every round has a
          </p>
          <p className="text-3xl font-black gradient-text mb-8">unique twist</p>
          <p className="text-white/50 max-w-lg mx-auto mb-10">
            Play with 4–12 players. One is the Impostor. No two games are ever the same.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="game"
              size="xl"
              onClick={() => router.push("/register")}
              className="text-lg px-10"
            >
              🎮 Play Free Now
            </Button>
            <Button
              variant="glass"
              size="xl"
              onClick={() => router.push("/login")}
              className="text-lg px-10"
            >
              Sign In
            </Button>
          </div>
        </motion.div>

        {/* Twists scroll */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 w-full max-w-4xl overflow-hidden"
        >
          <p className="text-white/40 text-sm mb-4 uppercase tracking-widest">15 Game-Changing Twists</p>
          <div className="flex gap-3 flex-wrap justify-center">
            {TWISTS_PREVIEW.map((twist, i) => (
              <motion.div
                key={twist}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9 + i * 0.05 }}
              >
                <Badge variant="outline" className="text-sm py-1.5 px-3 border-white/20 text-white/60">
                  {twist}
                </Badge>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 max-w-6xl mx-auto w-full">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-bold text-center mb-12 gradient-text"
        >
          Why You&apos;ll Love It
        </motion.h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 hover:border-purple-500/30 transition-all duration-300"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-lg mb-2 text-white">{f.title}</h3>
              <p className="text-white/60 text-sm">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-16 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="glass-card max-w-2xl mx-auto p-10"
        >
          <div className="text-4xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold mb-3 text-white">Ready to Play?</h2>
          <p className="text-white/60 mb-8">Create a free account and invite your friends. First game takes 2 minutes to set up.</p>
          <Button variant="game" size="xl" onClick={() => router.push("/register")} className="px-12">
            Get Started — It&apos;s Free!
          </Button>
        </motion.div>
      </section>

      <footer className="text-center py-6 text-white/30 text-sm border-t border-white/10">
        <p>Who&apos;s the Impostor: Twist Edition • Built with Next.js 15 • Deployable on Vercel</p>
      </footer>
    </div>
  );
}
