// ============================================================
// Core Game Types
// ============================================================

export type GameMode = "classic" | "chaos" | "ranked" | "custom";
export type GameStatus = "assigning" | "discussion" | "voting" | "revealing" | "finished";
export type RoomStatus = "lobby" | "playing" | "finished";
export type PlayerRole = "innocent" | "impostor" | "double_agent";
export type VoteType = "anonymous" | "public";

// ============================================================
// Twist System
// ============================================================
export type TwistType =
  | "reverse_round"
  | "double_agent"
  | "silent_round"
  | "fake_hint"
  | "lucky_guess"
  | "hidden_category"
  | "swap_roles"
  | "memory_loss"
  | "secret_alliance"
  | "time_bomb"
  | "chaos_round"
  | "word_mutation"
  | "twin_mode"
  | "mute_curse"
  | "mystery_box";

export interface Twist {
  type: TwistType;
  name: string;
  description: string;
  icon: string;
  color: string;
  data?: Record<string, unknown>;
}

// ============================================================
// Ability System
// ============================================================
export type AbilityType =
  | "reveal_category"
  | "skip_vote"
  | "double_vote"
  | "force_first"
  | "protect_self"
  | "cancel_ability"
  | "swap_votes"
  | "freeze_timer"
  | "trigger_revote"
  | "view_word_category"
  | "force_random_first";

export interface Ability {
  type: AbilityType;
  name: string;
  description: string;
  icon: string;
  color: string;
}

// ============================================================
// Room & Player State
// ============================================================
export interface PlayerProfile {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  level: number;
  avatar: string;
  border: string;
  title: string;
  emote: string;
  voteEffect: string;
  isHost: boolean;
  isReady: boolean;
}

export interface GamePlayerState {
  id: string;
  userId: string;
  displayName: string;
  avatar: string;
  border: string;
  title: string;
  role?: PlayerRole; // Only visible to owner or after reveal
  wordShown?: string; // Only visible to owner
  ability?: AbilityType;
  abilityUsed: boolean;
  isEliminated: boolean;
  speakingOrder?: number;
  hasVoted?: boolean;
  votesReceived?: number; // During voting
}

export interface RoomSettings {
  discussionTime: number;
  votingTime: number;
  numImpostors: number;
  anonymousVoting: boolean;
  enableAbilities: boolean;
  enableTwists: boolean;
  enabledTwists: TwistType[];
  gameMode: GameMode;
  maxPlayers: number;
}

export interface RoomState {
  id: string;
  code: string;
  hostId: string;
  name: string;
  status: RoomStatus;
  settings: RoomSettings;
  players: PlayerProfile[];
  currentGame?: GameState;
  updatedAt: number;
}

export interface GameState {
  id: string;
  roomId: string;
  roundNumber: number;
  status: GameStatus;
  category?: string; // Visible to all
  activeTwist?: Twist;
  players: GamePlayerState[];
  discussionStartedAt?: number;
  votingStartedAt?: number;
  discussionTimeLimit: number;
  votingTimeLimit: number;
  dailyEvent?: DailyEvent;
  revealData?: RevealData;
  votes?: VoteResult[];
  eliminatedPlayer?: string;
  wordMutated?: boolean; // For word_mutation twist
}

export interface VoteResult {
  voterId: string;
  targetId: string | null; // null = skip
  isDouble: boolean;
}

export interface RevealData {
  secretWord: string;
  category: string;
  twist: Twist | null;
  players: Array<{
    userId: string;
    displayName: string;
    role: PlayerRole;
    wordShown: string | null;
    ability: AbilityType | null;
    abilityUsed: boolean;
  }>;
  eliminatedPlayer: string | null;
  outcome: "impostors_caught" | "impostors_win" | "no_elimination";
  stats: RoundStats;
  xpBreakdown: Array<{
    userId: string;
    displayName: string;
    xp: number;
    coins: number;
    reasons: string[];
  }>;
}

export interface RoundStats {
  mostSuspicious?: string;
  biggestLiar?: string;
  detective?: string;
  masterDeceiver?: string;
  fastestVote?: string;
  silentPlayer?: string;
  mostTrusted?: string;
  chaosCreator?: string;
}

// ============================================================
// Chat & Messages
// ============================================================
export type MessageType = "text" | "emoji" | "system" | "quick_chat";

export interface ChatMessage {
  id: string;
  userId: string;
  displayName: string;
  avatar: string;
  content: string;
  type: MessageType;
  createdAt: number;
}

// ============================================================
// Progression
// ============================================================
export interface PlayerStats {
  level: number;
  xp: number;
  xpForNextLevel: number;
  coins: number;
  totalGames: number;
  gamesWon: number;
  timesImpostor: number;
  impostorWins: number;
  correctGuesses: number;
  winRate: number;
  impostorWinRate: number;
}

export interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xpReward: number;
  coinReward: number;
  unlocked?: boolean;
  unlockedAt?: Date;
}

export interface Cosmetic {
  id: string;
  key: string;
  name: string;
  description: string;
  type: "avatar" | "border" | "title" | "emote" | "vote_effect" | "lobby_effect";
  rarity: "common" | "rare" | "epic" | "legendary";
  coinCost: number;
  levelRequired: number;
  preview: string;
  owned?: boolean;
}

export interface Mission {
  id: string;
  key: string;
  name: string;
  description: string;
  type: "daily" | "weekly" | "seasonal";
  goalType: string;
  goalAmount: number;
  xpReward: number;
  coinReward: number;
  progress: number;
  completed: boolean;
  expiresAt: Date;
}

// ============================================================
// Daily Events
// ============================================================
export type DailyEventType =
  | "double_xp"
  | "double_coins"
  | "reverse_voting"
  | "mystery_words"
  | "fast_discussion"
  | "hidden_categories";

export interface DailyEvent {
  id: string;
  date: string;
  eventType: DailyEventType;
  name: string;
  description: string;
  multiplier: number;
}

// ============================================================
// Ranking
// ============================================================
export type RankTier = "bronze" | "silver" | "gold" | "platinum" | "diamond" | "master";

export interface RankedInfo {
  tier: RankTier;
  points: number;
  wins: number;
  losses: number;
  seasonName: string;
}

// ============================================================
// API Response Types
// ============================================================
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PollResponse {
  roomState: RoomState | null;
  messages: ChatMessage[];
  timestamp: number;
}
