export interface AchievementDef {
  key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xpReward: number;
  coinReward: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // Impostor Achievements
  { key: "first_impostor", name: "Born Liar", description: "Play your first game as the Impostor", icon: "🎭", category: "impostor", xpReward: 50, coinReward: 25 },
  { key: "impostor_win_5", name: "Deceiver", description: "Win 5 games as the Impostor", icon: "😈", category: "impostor", xpReward: 150, coinReward: 75 },
  { key: "impostor_win_25", name: "Master Deceiver", description: "Win 25 games as the Impostor", icon: "🕵️", category: "impostor", xpReward: 500, coinReward: 250 },
  { key: "fool_everyone", name: "The Great Illusion", description: "Win as Impostor without a single vote against you", icon: "✨", category: "impostor", xpReward: 300, coinReward: 150 },
  { key: "double_agent_win", name: "Double Trouble", description: "Win as a Double Agent", icon: "🕴️", category: "impostor", xpReward: 200, coinReward: 100 },

  // Detective Achievements
  { key: "first_guess", name: "Eye for Lies", description: "Correctly identify the Impostor for the first time", icon: "🔍", category: "detective", xpReward: 50, coinReward: 25 },
  { key: "correct_guess_10", name: "Detective", description: "Correctly identify the Impostor 10 times", icon: "🏆", category: "detective", xpReward: 200, coinReward: 100 },
  { key: "correct_guess_50", name: "Grand Detective", description: "Correctly identify the Impostor 50 times", icon: "👑", category: "detective", xpReward: 750, coinReward: 350 },
  { key: "no_vote_win", name: "Ghost Player", description: "Win without receiving a single vote all game", icon: "👻", category: "detective", xpReward: 200, coinReward: 100 },

  // Social Achievements
  { key: "play_with_5_friends", name: "Social Circle", description: "Play with 5 different friends", icon: "👥", category: "social", xpReward: 100, coinReward: 50 },
  { key: "full_room", name: "Full House", description: "Play in a room with 12 players", icon: "🏠", category: "social", xpReward: 150, coinReward: 75 },
  { key: "host_10", name: "Game Master", description: "Host 10 games", icon: "🎮", category: "social", xpReward: 200, coinReward: 100 },

  // Twist Achievements
  { key: "all_twists", name: "Twist Connoisseur", description: "Experience every twist at least once", icon: "🌪️", category: "twists", xpReward: 500, coinReward: 250 },
  { key: "silent_win", name: "Silent Predator", description: "Win a Silent Round as Impostor", icon: "🤫", category: "twists", xpReward: 300, coinReward: 150 },
  { key: "survive_time_bomb", name: "Defused!", description: "Survive being the Time Bomb target", icon: "💣", category: "twists", xpReward: 200, coinReward: 100 },
  { key: "memory_master", name: "Perfect Memory", description: "Win during a Memory Loss round", icon: "🧠", category: "twists", xpReward: 250, coinReward: 125 },

  // Progression Achievements
  { key: "level_10", name: "Rising Star", description: "Reach level 10", icon: "⭐", category: "progression", xpReward: 200, coinReward: 100 },
  { key: "level_25", name: "Veteran Agent", description: "Reach level 25", icon: "🌟", category: "progression", xpReward: 500, coinReward: 250 },
  { key: "level_50", name: "Elite Operative", description: "Reach level 50", icon: "💫", category: "progression", xpReward: 1000, coinReward: 500 },
  { key: "collect_10_cosmetics", name: "Fashionista", description: "Collect 10 cosmetic items", icon: "🎨", category: "progression", xpReward: 150, coinReward: 75 },
  { key: "login_streak_7", name: "Dedicated Agent", description: "Log in 7 days in a row", icon: "📅", category: "progression", xpReward: 200, coinReward: 100 },
  { key: "login_streak_30", name: "Loyal Operative", description: "Log in 30 days in a row", icon: "🗓️", category: "progression", xpReward: 750, coinReward: 375 },

  // Gameplay Achievements
  { key: "games_10", name: "Getting Started", description: "Play 10 games", icon: "🎲", category: "gameplay", xpReward: 100, coinReward: 50 },
  { key: "games_50", name: "Seasoned Player", description: "Play 50 games", icon: "🎯", category: "gameplay", xpReward: 300, coinReward: 150 },
  { key: "games_100", name: "Centurion", description: "Play 100 games", icon: "💯", category: "gameplay", xpReward: 750, coinReward: 375 },
  { key: "use_all_abilities", name: "Power User", description: "Use every ability type at least once", icon: "⚡", category: "gameplay", xpReward: 400, coinReward: 200 },
  { key: "ranked_gold", name: "Gold Standard", description: "Reach Gold rank", icon: "🥇", category: "ranked", xpReward: 300, coinReward: 150 },
  { key: "ranked_diamond", name: "Diamond Mind", description: "Reach Diamond rank", icon: "💎", category: "ranked", xpReward: 750, coinReward: 375 },
  { key: "ranked_master", name: "The Master", description: "Reach Master rank", icon: "🏆", category: "ranked", xpReward: 1500, coinReward: 750 },
];
