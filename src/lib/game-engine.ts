import { TwistType, AbilityType, PlayerRole, GameState, Twist, RevealData } from "@/types/game";
import { ALL_TWISTS, getRandomTwist } from "@/lib/game-data/twists";
import { getRandomAbilities } from "@/lib/game-data/abilities";
import {
  getRandomWord,
  getMisleadingWord,
  getChaosWords,
  getTwoRelatedWords,
  WordEntry,
} from "@/lib/game-data/words";
import { shuffleArray } from "@/lib/utils";

export interface RoleAssignment {
  userId: string;
  role: PlayerRole;
  wordShown: string | null;
  ability: AbilityType | null;
  twistSpecific?: Record<string, unknown>;
}

export interface GameSetup {
  secretWord: string;
  category: string;
  activeTwist: Twist | null;
  assignments: RoleAssignment[];
  twistData: Record<string, unknown>;
}

/**
 * Core game setup logic — runs server-side only
 */
export function setupGame(
  playerIds: string[],
  numImpostors: number,
  enableTwists: boolean,
  enableAbilities: boolean,
  enabledTwists?: TwistType[],
  forcedTwist?: TwistType
): GameSetup {
  // Pick word
  const wordEntry = getRandomWord();
  const activeTwist: Twist | null = enableTwists
    ? forcedTwist
      ? ALL_TWISTS[forcedTwist]
      : getRandomTwist(enabledTwists)
    : null;

  const twistData: Record<string, unknown> = {};
  
  // Shuffle players for role assignment
  const shuffled = shuffleArray([...playerIds]);
  
  // Assign impostors
  const actualImpostors = Math.min(numImpostors, Math.floor(playerIds.length / 2));
  const impostorIds = new Set(shuffled.slice(0, actualImpostors));
  
  // Assign abilities
  let abilityPool: AbilityType[] = [];
  if (enableAbilities) {
    const numAbilities = Math.floor(playerIds.length / 3);
    abilityPool = getRandomAbilities(numAbilities);
  }

  let assignments: RoleAssignment[] = playerIds.map((userId, i) => ({
    userId,
    role: impostorIds.has(userId) ? "impostor" : "innocent",
    wordShown: impostorIds.has(userId) ? null : wordEntry.word,
    ability: enableAbilities && abilityPool[i] ? abilityPool[i] : null,
  }));

  // Apply twist modifications
  if (activeTwist) {
    assignments = applyTwistToAssignments(
      assignments,
      activeTwist,
      wordEntry,
      twistData
    );
  }

  return {
    secretWord: wordEntry.word,
    category: wordEntry.category,
    activeTwist,
    assignments,
    twistData,
  };
}

function applyTwistToAssignments(
  assignments: RoleAssignment[],
  twist: Twist,
  wordEntry: WordEntry,
  twistData: Record<string, unknown>
): RoleAssignment[] {
  const result = [...assignments];
  const innocents = result.filter((a) => a.role === "innocent");
  const impostors = result.filter((a) => a.role === "impostor");

  switch (twist.type) {
    case "reverse_round": {
      // Impostor gets the word, one innocent doesn't
      impostors.forEach((a) => {
        a.wordShown = wordEntry.word;
      });
      if (innocents.length > 0) {
        const luckyIdx = Math.floor(Math.random() * innocents.length);
        const lucky = innocents[luckyIdx];
        const assignment = result.find((a) => a.userId === lucky.userId);
        if (assignment) {
          assignment.wordShown = null;
          twistData.reversedInnocentId = lucky.userId;
        }
      }
      break;
    }

    case "double_agent": {
      // 2 impostors if only 1, neither knows the other
      if (impostors.length === 1 && innocents.length > 0) {
        const newImpostorIdx = Math.floor(Math.random() * innocents.length);
        const newImpostor = innocents[newImpostorIdx];
        const assignment = result.find((a) => a.userId === newImpostor.userId);
        if (assignment) {
          assignment.role = "double_agent";
          assignment.wordShown = null;
        }
      }
      break;
    }

    case "fake_hint": {
      // Impostor gets a misleading word
      impostors.forEach((a) => {
        a.wordShown = getMisleadingWord(wordEntry);
        twistData.fakeWord = a.wordShown;
      });
      break;
    }

    case "lucky_guess": {
      // One innocent gets no word
      if (innocents.length > 1) {
        const luckyIdx = Math.floor(Math.random() * innocents.length);
        const lucky = innocents[luckyIdx];
        const assignment = result.find((a) => a.userId === lucky.userId);
        if (assignment) {
          assignment.wordShown = null;
          twistData.luckyPlayerId = lucky.userId;
        }
      }
      break;
    }

    case "twin_mode": {
      // Two innocents get different but related words
      const related = getTwoRelatedWords(wordEntry.category);
      if (related && innocents.length >= 2) {
        const [twin1, twin2] = shuffleArray(innocents).slice(0, 2);
        const a1 = result.find((a) => a.userId === twin1.userId);
        const a2 = result.find((a) => a.userId === twin2.userId);
        if (a1) a1.wordShown = related[0].word;
        if (a2) a2.wordShown = related[1].word;
        twistData.twin1Word = related[0].word;
        twistData.twin2Word = related[1].word;
      }
      break;
    }

    case "chaos_round": {
      // Two random categories, half get word from each
      const chaos = getChaosWords();
      result.forEach((a, i) => {
        if (a.role !== "impostor") {
          a.wordShown = i % 2 === 0 ? chaos.word1.word : chaos.word2.word;
        }
      });
      twistData.chaosWord1 = chaos.word1.word;
      twistData.chaosWord2 = chaos.word2.word;
      twistData.chaosCategory1 = chaos.word1.category;
      twistData.chaosCategory2 = chaos.word2.category;
      break;
    }

    case "time_bomb": {
      // Randomly pick one innocent as the "time bomb" target
      if (innocents.length > 0) {
        const target = innocents[Math.floor(Math.random() * innocents.length)];
        twistData.timeBombTargetId = target.userId;
      }
      break;
    }

    case "secret_alliance": {
      // Two random innocents know each other
      if (innocents.length >= 2) {
        const [ally1, ally2] = shuffleArray(innocents).slice(0, 2);
        twistData.allianceMember1 = ally1.userId;
        twistData.allianceMember2 = ally2.userId;
      }
      break;
    }

    case "mute_curse": {
      // One random player gets muted at the end
      const allPlayers = shuffleArray(result);
      if (allPlayers.length > 0) {
        twistData.mutedPlayerId = allPlayers[0].userId;
      }
      break;
    }

    case "swap_roles": {
      // Mark two players for mid-discussion swap — actual swap happens server-side
      const eligible = shuffleArray(result).slice(0, 2);
      if (eligible.length === 2) {
        twistData.swapPlayer1 = eligible[0].userId;
        twistData.swapPlayer2 = eligible[1].userId;
      }
      break;
    }

    default:
      break;
  }

  return result;
}

/**
 * Calculate vote outcome
 */
export function calculateVotes(
  votes: Array<{ casterId: string; targetId: string | null; isDouble: boolean }>,
  playerIds: string[]
): {
  eliminatedId: string | null;
  isTie: boolean;
  voteCounts: Record<string, number>;
  skipCount: number;
} {
  const voteCounts: Record<string, number> = {};
  let skipCount = 0;

  for (const vote of votes) {
    if (vote.targetId === null) {
      skipCount += vote.isDouble ? 2 : 1;
    } else {
      voteCounts[vote.targetId] = (voteCounts[vote.targetId] || 0) + (vote.isDouble ? 2 : 1);
    }
  }

  // Find player with most votes
  let maxVotes = 0;
  let eliminatedId: string | null = null;
  let isTie = false;

  for (const [playerId, count] of Object.entries(voteCounts)) {
    if (count > maxVotes) {
      maxVotes = count;
      eliminatedId = playerId;
      isTie = false;
    } else if (count === maxVotes) {
      isTie = true;
    }
  }

  // Skip wins ties or if skip has most
  if (isTie || skipCount > maxVotes) {
    eliminatedId = null;
    isTie = skipCount <= maxVotes;
  }

  return { eliminatedId, isTie, voteCounts, skipCount };
}

/**
 * Calculate round statistics
 */
export function calculateRoundStats(
  votes: Array<{ casterId: string; targetId: string | null; timestamp: number }>,
  players: Array<{ userId: string; role: PlayerRole; isImpostor: boolean }>
): Record<string, string> {
  const stats: Record<string, string> = {};

  // Most suspicious (received most votes)
  const voteCount: Record<string, number> = {};
  for (const vote of votes) {
    if (vote.targetId) {
      voteCount[vote.targetId] = (voteCount[vote.targetId] || 0) + 1;
    }
  }
  const sortedByVotes = Object.entries(voteCount).sort((a, b) => b[1] - a[1]);
  if (sortedByVotes.length > 0) stats.mostSuspicious = sortedByVotes[0][0];

  // Fastest vote
  const sortedByTime = [...votes].sort((a, b) => a.timestamp - b.timestamp);
  if (sortedByTime.length > 0) stats.fastestVote = sortedByTime[0].casterId;

  // Silent player (no vote cast)
  const voterIds = new Set(votes.map((v) => v.casterId));
  const silentPlayer = players.find((p) => !voterIds.has(p.userId));
  if (silentPlayer) stats.silentPlayer = silentPlayer.userId;

  // Most trusted (received fewest votes or none)
  const noVotes = players.filter((p) => !voteCount[p.userId]);
  if (noVotes.length > 0) {
    stats.mostTrusted = noVotes[Math.floor(Math.random() * noVotes.length)].userId;
  }

  return stats;
}

/**
 * XP rewards calculation
 */
export function calculateXPRewards(
  players: Array<{
    userId: string;
    displayName: string;
    role: PlayerRole;
    isEliminated: boolean;
  }>,
  eliminatedId: string | null,
  impostorsWon: boolean,
  dailyMultiplier: number = 1
): Array<{ userId: string; displayName: string; xp: number; coins: number; reasons: string[] }> {
  return players.map((player) => {
    let xp = 20; // base participation
    let coins = 10;
    const reasons = ["Participation: +20 XP, +10 coins"];

    const isImpostor = player.role === "impostor" || player.role === "double_agent";
    const isWinner =
      (isImpostor && impostorsWon) || (!isImpostor && !impostorsWon);

    if (isWinner) {
      xp += 50;
      coins += 25;
      reasons.push("Victory: +50 XP, +25 coins");
    }

    if (isImpostor && isWinner) {
      xp += 30;
      coins += 15;
      reasons.push("Impostor Bonus: +30 XP, +15 coins");
    }

    if (!isImpostor && eliminatedId && eliminatedId === player.userId) {
      // Eliminated incorrectly — still rewarded for good deception target
    }

    if (dailyMultiplier > 1) {
      xp = Math.floor(xp * dailyMultiplier);
      coins = Math.floor(coins * dailyMultiplier);
      reasons.push(`Daily Event x${dailyMultiplier}`);
    }

    return { userId: player.userId, displayName: player.displayName, xp, coins, reasons };
  });
}
