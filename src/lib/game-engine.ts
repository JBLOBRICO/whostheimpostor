import { TwistType, AbilityType, PlayerRole } from "@/types/game";
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
import { Twist } from "@/types/game";

export interface RoleAssignment {
  userId: string;
  role: PlayerRole;
  wordShown: string | null;
  ability: AbilityType | null;
}

export interface GameSetup {
  secretWord: string;
  category: string;
  activeTwist: Twist | null;
  assignments: RoleAssignment[];
  twistData: Record<string, unknown>;
}

export function setupGame(
  playerIds: string[],
  numImpostors: number,
  enableTwists: boolean,
  enableAbilities: boolean,
  enabledTwists?: TwistType[],
  forcedTwist?: TwistType
): GameSetup {
  const wordEntry = getRandomWord();
  const activeTwist: Twist | null = enableTwists
    ? forcedTwist
      ? ALL_TWISTS[forcedTwist]
      : getRandomTwist(enabledTwists)
    : null;

  const twistData: Record<string, unknown> = {};

  // Shuffle players for role assignment
  const shuffled = shuffleArray([...playerIds]);
  const actualImpostors = Math.min(numImpostors, Math.floor(playerIds.length / 2));
  const impostorIds = new Set(shuffled.slice(0, actualImpostors));

  // Assign abilities — shuffle separately so impostors don't always get first abilities
  let abilityPool: AbilityType[] = [];
  if (enableAbilities) {
    const numAbilities = Math.max(1, Math.floor(playerIds.length / 3));
    abilityPool = getRandomAbilities(numAbilities);
  }

  // Shuffle ability recipients independently
  const abilityRecipients = shuffleArray([...playerIds]).slice(0, abilityPool.length);
  const abilityMap = new Map<string, AbilityType>();
  abilityRecipients.forEach((uid, i) => {
    if (abilityPool[i]) abilityMap.set(uid, abilityPool[i]);
  });

  // Build initial assignments — impostors get null word, innocents get the word
  let assignments: RoleAssignment[] = playerIds.map((userId) => ({
    userId,
    role: impostorIds.has(userId) ? ("impostor" as PlayerRole) : ("innocent" as PlayerRole),
    wordShown: impostorIds.has(userId) ? null : wordEntry.word,
    ability: abilityMap.get(userId) ?? null,
  }));

  // Don't give double_vote to impostor (too powerful) — swap with innocent if needed
  assignments = assignments.map((a) => {
    if ((a.role === "impostor" || a.role === "double_agent") && a.ability === "double_vote") {
      // Find an innocent without an ability and swap
      const swap = assignments.find((x) => x.role === "innocent" && x.ability === null);
      if (swap) {
        swap.ability = "double_vote";
        return { ...a, ability: null };
      }
    }
    return a;
  });

  if (activeTwist) {
    assignments = applyTwistToAssignments(assignments, activeTwist, wordEntry, twistData);
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
      // Impostor gets the word; one random innocent does not
      impostors.forEach((a) => {
        const r = result.find((x) => x.userId === a.userId);
        if (r) r.wordShown = wordEntry.word;
      });
      if (innocents.length > 0) {
        const lucky = innocents[Math.floor(Math.random() * innocents.length)];
        const r = result.find((x) => x.userId === lucky.userId);
        if (r) { r.wordShown = null; twistData.reversedInnocentId = lucky.userId; }
      }
      break;
    }

    case "double_agent": {
      // Add a second impostor if only one exists
      if (impostors.length === 1 && innocents.length > 1) {
        const newImpostor = innocents[Math.floor(Math.random() * innocents.length)];
        const r = result.find((x) => x.userId === newImpostor.userId);
        if (r) { r.role = "double_agent"; r.wordShown = null; }
      }
      break;
    }

    case "fake_hint": {
      // Impostor sees a believable but wrong word
      impostors.forEach((a) => {
        const r = result.find((x) => x.userId === a.userId);
        if (r) { r.wordShown = getMisleadingWord(wordEntry); twistData.fakeWord = r.wordShown; }
      });
      break;
    }

    case "lucky_guess": {
      // One innocent also gets no word
      if (innocents.length > 1) {
        const lucky = innocents[Math.floor(Math.random() * innocents.length)];
        const r = result.find((x) => x.userId === lucky.userId);
        if (r) { r.wordShown = null; twistData.luckyPlayerId = lucky.userId; }
      }
      break;
    }

    case "twin_mode": {
      // Two innocents get different but related words
      const related = getTwoRelatedWords(wordEntry.category);
      if (related && innocents.length >= 2) {
        const [twin1, twin2] = shuffleArray(innocents).slice(0, 2);
        const r1 = result.find((x) => x.userId === twin1.userId);
        const r2 = result.find((x) => x.userId === twin2.userId);
        if (r1) r1.wordShown = related[0].word;
        if (r2) r2.wordShown = related[1].word;
        twistData.twin1Id = twin1.userId;
        twistData.twin2Id = twin2.userId;
        twistData.twin1Word = related[0].word;
        twistData.twin2Word = related[1].word;
      }
      break;
    }

    case "chaos_round": {
      // Two random categories — innocents split between them, impostor gets one as a "hint"
      const chaos = getChaosWords();
      result.forEach((a, i) => {
        const r = result.find((x) => x.userId === a.userId);
        if (!r) return;
        if (a.role === "innocent") {
          r.wordShown = i % 2 === 0 ? chaos.word1.word : chaos.word2.word;
        } else {
          // Impostor gets one of the chaos words as a deliberate misdirection
          r.wordShown = chaos.word1.word;
        }
      });
      twistData.chaosWord1 = chaos.word1.word;
      twistData.chaosWord2 = chaos.word2.word;
      twistData.chaosCategory1 = chaos.word1.category;
      twistData.chaosCategory2 = chaos.word2.category;
      break;
    }

    case "time_bomb": {
      if (innocents.length > 0) {
        const target = innocents[Math.floor(Math.random() * innocents.length)];
        twistData.timeBombTargetId = target.userId;
      }
      break;
    }

    case "secret_alliance": {
      if (innocents.length >= 2) {
        const [ally1, ally2] = shuffleArray(innocents).slice(0, 2);
        twistData.allianceMember1 = ally1.userId;
        twistData.allianceMember2 = ally2.userId;
      }
      break;
    }

    case "mute_curse": {
      // One random non-host player gets muted near end of discussion
      const allShuffled = shuffleArray(result);
      if (allShuffled.length > 0) {
        twistData.mutedPlayerId = allShuffled[0].userId;
      }
      break;
    }

    case "swap_roles": {
      // Two random players will swap roles mid-discussion (server triggers at 50% time)
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
 * Calculate vote outcome — fixed tie-breaking logic
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
    const weight = vote.isDouble ? 2 : 1;
    if (vote.targetId === null) {
      skipCount += weight;
    } else {
      voteCounts[vote.targetId] = (voteCounts[vote.targetId] || 0) + weight;
    }
  }

  // Find max votes
  let maxVotes = 0;
  for (const count of Object.values(voteCounts)) {
    if (count > maxVotes) maxVotes = count;
  }

  // Find all players tied at max
  const topPlayers = Object.entries(voteCounts).filter(([, count]) => count === maxVotes);

  // Tie: multiple players have max votes, or skip has >= max votes
  const hasTie = topPlayers.length > 1;
  const skipWins = skipCount >= maxVotes && maxVotes > 0;
  const noVotes = maxVotes === 0;

  if (noVotes || hasTie || skipWins) {
    return { eliminatedId: null, isTie: hasTie, voteCounts, skipCount };
  }

  return {
    eliminatedId: topPlayers[0][0],
    isTie: false,
    voteCounts,
    skipCount,
  };
}

/**
 * Calculate XP/coin rewards
 */
export function calculateXPRewards(
  players: Array<{
    userId: string;
    displayName: string;
    role: PlayerRole;
    isEliminated: boolean;
  }>,
  eliminatedId: string | null,
  impostorsWin: boolean,
  dailyMultiplier: number = 1
): Array<{ userId: string; displayName: string; xp: number; coins: number; reasons: string[] }> {
  return players.map((player) => {
    let xp = 20;
    let coins = 10;
    const reasons = ["Participation: +20 XP, +10 coins"];

    const isImpostor = player.role === "impostor" || player.role === "double_agent";
    const won = (isImpostor && impostorsWin) || (!isImpostor && !impostorsWin);

    if (won) {
      xp += 50; coins += 25;
      reasons.push("Victory: +50 XP, +25 coins");
    }
    if (isImpostor && won) {
      xp += 30; coins += 15;
      reasons.push("Impostor Bonus: +30 XP, +15 coins");
    }
    if (!isImpostor && eliminatedId) {
      // Correct guess bonus handled in revealResults
    }

    if (dailyMultiplier > 1) {
      xp = Math.floor(xp * dailyMultiplier);
      coins = Math.floor(coins * dailyMultiplier);
      reasons.push(`Daily Bonus x${dailyMultiplier}`);
    }

    return { userId: player.userId, displayName: player.displayName, xp, coins, reasons };
  });
}
