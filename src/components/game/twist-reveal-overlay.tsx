"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Twist } from "@/types/game";

interface TwistRevealOverlayProps {
  twist: Twist | null | undefined;
  visible: boolean;
}

export function TwistRevealOverlay({ twist, visible }: TwistRevealOverlayProps) {
  if (!twist) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.5, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0.5, rotate: 10, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="text-center px-8"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-8xl mb-6"
            >
              {twist.icon}
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-white/60 text-sm uppercase tracking-[0.3em] mb-3"
            >
              Active Twist
            </motion.p>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`text-5xl font-black bg-gradient-to-r ${twist.color} bg-clip-text text-transparent mb-4`}
            >
              {twist.name}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-white/70 text-lg max-w-sm mx-auto"
            >
              {twist.description}
            </motion.p>

            {/* Particles */}
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: 0, y: 0, opacity: 1, scale: 1,
                }}
                animate={{
                  x: (Math.random() - 0.5) * 400,
                  y: (Math.random() - 0.5) * 400,
                  opacity: 0,
                  scale: 0,
                }}
                transition={{ delay: 0.2, duration: 1.5 }}
                className="absolute w-2 h-2 rounded-full bg-purple-400"
                style={{
                  left: "50%",
                  top: "50%",
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
