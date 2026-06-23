import { Twist, TwistType } from "@/types/game";

export const ALL_TWISTS: Record<TwistType, Twist> = {
  reverse_round: {
    type: "reverse_round",
    name: "Reverse Round",
    description: "The Impostor secretly knows the word — one innocent player does not!",
    icon: "🔄",
    color: "from-purple-500 to-pink-500",
  },
  double_agent: {
    type: "double_agent",
    name: "Double Agent",
    description: "Two Impostors exist but neither knows the other's identity.",
    icon: "🕵️",
    color: "from-red-500 to-orange-500",
  },
  silent_round: {
    type: "silent_round",
    name: "Silent Round",
    description: "Players may only communicate using emojis during the opening phase.",
    icon: "🤫",
    color: "from-blue-500 to-cyan-500",
  },
  fake_hint: {
    type: "fake_hint",
    name: "Fake Hint",
    description: "The Impostor receives a believable but incorrect word.",
    icon: "🎭",
    color: "from-yellow-500 to-orange-500",
  },
  lucky_guess: {
    type: "lucky_guess",
    name: "Lucky Guess",
    description: "One random innocent player also receives no word — just like the Impostor!",
    icon: "🍀",
    color: "from-green-500 to-teal-500",
  },
  hidden_category: {
    type: "hidden_category",
    name: "Hidden Category",
    description: "Only the category is shown — the actual word remains secret.",
    icon: "👁️",
    color: "from-indigo-500 to-purple-500",
  },
  swap_roles: {
    type: "swap_roles",
    name: "Swap Roles",
    description: "Two random players secretly exchange roles midway through discussion.",
    icon: "↔️",
    color: "from-pink-500 to-rose-500",
  },
  memory_loss: {
    type: "memory_loss",
    name: "Memory Loss",
    description: "Displayed words disappear after 10 seconds. Remember yours!",
    icon: "🧠",
    color: "from-violet-500 to-purple-500",
  },
  secret_alliance: {
    type: "secret_alliance",
    name: "Secret Alliance",
    description: "Two innocent players secretly know each other's identities.",
    icon: "🤝",
    color: "from-emerald-500 to-green-500",
  },
  time_bomb: {
    type: "time_bomb",
    name: "Time Bomb",
    description: "One selected player has limited time to defend themselves during voting.",
    icon: "💣",
    color: "from-red-600 to-red-400",
  },
  chaos_round: {
    type: "chaos_round",
    name: "Chaos Round",
    description: "Two unrelated categories combine into one wild word pool!",
    icon: "🌪️",
    color: "from-orange-500 to-red-500",
  },
  word_mutation: {
    type: "word_mutation",
    name: "Word Mutation",
    description: "The secret word changes midway through discussion — except the Impostor's stays the same.",
    icon: "🧬",
    color: "from-cyan-500 to-blue-500",
  },
  twin_mode: {
    type: "twin_mode",
    name: "Twin Mode",
    description: "Two innocent players receive different but closely related words.",
    icon: "👯",
    color: "from-fuchsia-500 to-pink-500",
  },
  mute_curse: {
    type: "mute_curse",
    name: "Mute Curse",
    description: "One random player cannot speak during the final moments of discussion.",
    icon: "🔇",
    color: "from-gray-600 to-gray-400",
  },
  mystery_box: {
    type: "mystery_box",
    name: "Mystery Box",
    description: "A completely random event occurs just before voting begins. Expect anything!",
    icon: "📦",
    color: "from-amber-500 to-yellow-500",
  },
};

export const TWIST_LIST = Object.values(ALL_TWISTS);

export function getRandomTwist(enabled?: TwistType[]): Twist {
  const available = enabled
    ? TWIST_LIST.filter((t) => enabled.includes(t.type))
    : TWIST_LIST;
  return available[Math.floor(Math.random() * available.length)];
}
