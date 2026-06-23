export const AVATARS = [
  { key: "default", name: "Agent X", preview: "🕵️", rarity: "common", coinCost: 0, levelRequired: 1 },
  { key: "ninja", name: "Shadow Ninja", preview: "🥷", rarity: "common", coinCost: 100, levelRequired: 3 },
  { key: "alien", name: "Alien Spy", preview: "👽", rarity: "rare", coinCost: 250, levelRequired: 5 },
  { key: "robot", name: "Robo Agent", preview: "🤖", rarity: "rare", coinCost: 250, levelRequired: 7 },
  { key: "wizard", name: "Mind Wizard", preview: "🧙", rarity: "epic", coinCost: 500, levelRequired: 10 },
  { key: "ghost", name: "Phantom", preview: "👻", rarity: "epic", coinCost: 500, levelRequired: 12 },
  { key: "pirate", name: "Sea Rogue", preview: "🏴‍☠️", rarity: "rare", coinCost: 300, levelRequired: 8 },
  { key: "detective", name: "The Detective", preview: "🔍", rarity: "legendary", coinCost: 1000, levelRequired: 20 },
  { key: "dragon", name: "Dragon Lord", preview: "🐉", rarity: "legendary", coinCost: 1500, levelRequired: 30 },
  { key: "crown", name: "Royal Impostor", preview: "👑", rarity: "legendary", coinCost: 2000, levelRequired: 50 },
  { key: "fox", name: "Clever Fox", preview: "🦊", rarity: "common", coinCost: 150, levelRequired: 4 },
  { key: "wolf", name: "Pack Leader", preview: "🐺", rarity: "rare", coinCost: 350, levelRequired: 15 },
  { key: "cat", name: "Shadow Cat", preview: "🐱", rarity: "common", coinCost: 100, levelRequired: 2 },
];

export const BORDERS = [
  { key: "none", name: "No Border", preview: "border-none", rarity: "common", coinCost: 0, levelRequired: 1 },
  { key: "gold", name: "Golden Frame", preview: "border-yellow-400", rarity: "rare", coinCost: 200, levelRequired: 5 },
  { key: "neon_blue", name: "Neon Blue", preview: "border-blue-400", rarity: "rare", coinCost: 200, levelRequired: 6 },
  { key: "neon_pink", name: "Neon Pink", preview: "border-pink-400", rarity: "epic", coinCost: 400, levelRequired: 10 },
  { key: "fire", name: "Flame Border", preview: "border-orange-500", rarity: "epic", coinCost: 450, levelRequired: 15 },
  { key: "ice", name: "Ice Crystal", preview: "border-cyan-300", rarity: "epic", coinCost: 450, levelRequired: 18 },
  { key: "rainbow", name: "Rainbow Edge", preview: "border-purple-500", rarity: "legendary", coinCost: 1000, levelRequired: 25 },
  { key: "void", name: "Void Rift", preview: "border-gray-900", rarity: "legendary", coinCost: 1500, levelRequired: 40 },
];

export const TITLES = [
  { key: "Newcomer", name: "Newcomer", preview: "🌱", rarity: "common", coinCost: 0, levelRequired: 1 },
  { key: "Deceiver", name: "The Deceiver", preview: "🎭", rarity: "common", coinCost: 100, levelRequired: 5 },
  { key: "Sleuth", name: "Master Sleuth", preview: "🔍", rarity: "rare", coinCost: 250, levelRequired: 10 },
  { key: "Ghost", name: "The Ghost", preview: "👻", rarity: "rare", coinCost: 300, levelRequired: 15 },
  { key: "Phantom", name: "The Phantom", preview: "🌑", rarity: "epic", coinCost: 500, levelRequired: 20 },
  { key: "Legend", name: "Living Legend", preview: "⭐", rarity: "legendary", coinCost: 1000, levelRequired: 30 },
  { key: "Chaos", name: "Chaos Agent", preview: "🌪️", rarity: "epic", coinCost: 600, levelRequired: 25 },
  { key: "Shadow", name: "Shadow Master", preview: "🕳️", rarity: "legendary", coinCost: 1500, levelRequired: 50 },
  { key: "Grandmaster", name: "Grandmaster", preview: "👑", rarity: "legendary", coinCost: 2500, levelRequired: 75 },
];

export const EMOTES = [
  { key: "wave", name: "Wave", preview: "👋", rarity: "common", coinCost: 0, levelRequired: 1 },
  { key: "laugh", name: "Laugh", preview: "😂", rarity: "common", coinCost: 50, levelRequired: 2 },
  { key: "suspicious", name: "Suspicious", preview: "🤨", rarity: "common", coinCost: 50, levelRequired: 3 },
  { key: "shocked", name: "Shocked", preview: "😱", rarity: "common", coinCost: 75, levelRequired: 4 },
  { key: "victory", name: "Victory", preview: "✌️", rarity: "rare", coinCost: 150, levelRequired: 8 },
  { key: "evil_laugh", name: "Evil Laugh", preview: "😈", rarity: "rare", coinCost: 200, levelRequired: 10 },
  { key: "detective", name: "On The Case", preview: "🕵️", rarity: "epic", coinCost: 350, levelRequired: 15 },
  { key: "crown", name: "Royalty", preview: "👑", rarity: "legendary", coinCost: 750, levelRequired: 25 },
];

export const VOTE_EFFECTS = [
  { key: "default", name: "Default", preview: "⬜", rarity: "common", coinCost: 0, levelRequired: 1 },
  { key: "fire", name: "Fire Vote", preview: "🔥", rarity: "rare", coinCost: 200, levelRequired: 8 },
  { key: "ice", name: "Ice Vote", preview: "❄️", rarity: "rare", coinCost: 200, levelRequired: 10 },
  { key: "lightning", name: "Lightning Vote", preview: "⚡", rarity: "epic", coinCost: 400, levelRequired: 15 },
  { key: "confetti", name: "Confetti Vote", preview: "🎉", rarity: "epic", coinCost: 450, levelRequired: 18 },
  { key: "skull", name: "Skull Vote", preview: "💀", rarity: "epic", coinCost: 500, levelRequired: 20 },
  { key: "rainbow", name: "Rainbow Vote", preview: "🌈", rarity: "legendary", coinCost: 1000, levelRequired: 30 },
  { key: "void", name: "Void Vote", preview: "🌌", rarity: "legendary", coinCost: 1500, levelRequired: 40 },
];

export const RARITY_COLORS: Record<string, string> = {
  common: "text-gray-300 border-gray-500",
  rare: "text-blue-300 border-blue-500",
  epic: "text-purple-300 border-purple-500",
  legendary: "text-yellow-300 border-yellow-500",
};

export const RARITY_BG: Record<string, string> = {
  common: "bg-gray-500/20",
  rare: "bg-blue-500/20",
  epic: "bg-purple-500/20",
  legendary: "bg-yellow-500/20",
};
