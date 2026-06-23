import { Ability, AbilityType } from "@/types/game";

export const ALL_ABILITIES: Record<AbilityType, Ability> = {
  reveal_category: {
    type: "reveal_category",
    name: "Category Spy",
    description: "Reveal only a player's category (not their exact role) to everyone.",
    icon: "🔍",
    color: "text-blue-400",
  },
  skip_vote: {
    type: "skip_vote",
    name: "Vote Skip",
    description: "Skip your vote this round without penalty.",
    icon: "⏭️",
    color: "text-gray-400",
  },
  double_vote: {
    type: "double_vote",
    name: "Double Vote",
    description: "Your vote counts twice this round.",
    icon: "2️⃣",
    color: "text-yellow-400",
  },
  force_first: {
    type: "force_first",
    name: "Spotlight",
    description: "Force another player to explain themselves first.",
    icon: "🎤",
    color: "text-orange-400",
  },
  protect_self: {
    type: "protect_self",
    name: "Shield",
    description: "Protect yourself from elimination once this round.",
    icon: "🛡️",
    color: "text-green-400",
  },
  cancel_ability: {
    type: "cancel_ability",
    name: "Nullify",
    description: "Cancel another player's ability before they use it.",
    icon: "🚫",
    color: "text-red-400",
  },
  swap_votes: {
    type: "swap_votes",
    name: "Vote Swap",
    description: "Swap two players' votes after voting has ended.",
    icon: "🔀",
    color: "text-purple-400",
  },
  freeze_timer: {
    type: "freeze_timer",
    name: "Time Freeze",
    description: "Freeze another player's speaking timer for 10 seconds.",
    icon: "❄️",
    color: "text-cyan-400",
  },
  trigger_revote: {
    type: "trigger_revote",
    name: "Revote",
    description: "Trigger a complete revote after results are announced.",
    icon: "🔁",
    color: "text-indigo-400",
  },
  view_word_category: {
    type: "view_word_category",
    name: "Peek",
    description: "Secretly view only the category of the hidden word.",
    icon: "👀",
    color: "text-teal-400",
  },
  force_random_first: {
    type: "force_random_first",
    name: "Random Spotlight",
    description: "Force one random player to speak first.",
    icon: "🎲",
    color: "text-pink-400",
  },
};

export const ABILITY_LIST = Object.values(ALL_ABILITIES);

export function getRandomAbilities(count: number): AbilityType[] {
  const shuffled = [...ABILITY_LIST].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((a) => a.type);
}
