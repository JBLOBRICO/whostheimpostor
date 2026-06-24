"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { setupGame, calculateVotes, calculateXPRewards } from "@/lib/game-engine";
import { TwistType } from "@/types/game";
import { calculateLevelFromXP } from "@/lib/utils";

export async function startGame(roomId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const room = await db.room.findUnique({
    where: { id: roomId },
    include: { players: { include: { user: true } } },
  });

  if (!room) return { error: "Room not found" };
  if (room.hostId !== session.user.id) return { error: "Only the host can start the game" };
  if (room.status !== "lobby") return { error: "Game already started" };
  if (room.players.length < 4) return { error: "Need at least 4 players to start" };

  const playerIds = room.players.map((p) => p.userId);
  const enabledTwists = room.enabledTwists
    ? (JSON.parse(room.enabledTwists) as TwistType[])
    : undefined;

  const setup = setupGame(
    playerIds,
    room.numImpostors,
    room.enableTwists,
    room.enableAbilities,
    enabledTwists?.length ? enabledTwists : undefined
  );

  // Get today's daily event
  const today = new Date().toISOString().slice(0, 10);
  const dailyEvent = await db.dailyEvent.findUnique({ where: { date: today } });

  try {
    const game = await db.game.create({
      data: {
        roomId,
        roundNumber: 1,
        status: "assigning",
        secretWord: setup.secretWord,
        category: setup.category,
        activeTwist: setup.activeTwist?.type ?? null,
        twistData: JSON.stringify(setup.twistData),
        dailyEventId: dailyEvent?.id ?? null,
        players: {
          create: setup.assignments.map((a) => ({
            userId: a.userId,
            role: a.role,
            wordShown: a.wordShown ?? null,
            ability: a.ability ?? null,
          })),
        },
      },
    });

    await db.room.update({
      where: { id: roomId },
      data: { status: "playing", currentGameId: game.id, updatedAt: new Date() },
    });

    return { success: true, gameId: game.id };
  } catch (err) {
    console.error("Start game error:", err);
    return { error: "Failed to start game." };
  }
}

export async function startDiscussion(gameId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const game = await db.game.findUnique({
    where: { id: gameId },
    include: { room: true },
  });

  if (!game) return { error: "Game not found" };
  if (game.room.hostId !== session.user.id) return { error: "Only host can advance phases" };

  await db.game.update({
    where: { id: gameId },
    data: { status: "discussion", discussionStartedAt: new Date() },
  });

  await db.room.update({ where: { id: game.roomId }, data: { updatedAt: new Date() } });

  return { success: true };
}

export async function startVoting(gameId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const game = await db.game.findUnique({
    where: { id: gameId },
    include: { room: true },
  });

  if (!game) return { error: "Game not found" };

  // Allow host always, or allow auto-advance when discussion time expires
  const isHost = game.room.hostId === session.user.id;
  const isDiscussing = game.status === "discussion";
  if (!isHost && !isDiscussing) {
    return { error: "Cannot start voting now" };
  }

  await db.game.update({
    where: { id: gameId },
    data: { status: "voting", votingStartedAt: new Date() },
  });

  await db.room.update({ where: { id: game.roomId }, data: { updatedAt: new Date() } });

  return { success: true };
}

export async function castVote(gameId: string, targetUserId: string | null) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const game = await db.game.findUnique({
    where: { id: gameId },
    include: { players: true },
  });

  if (!game || game.status !== "voting") return { error: "Voting is not active" };

  const caster = game.players.find((p) => p.userId === session.user.id);
  if (!caster) return { error: "You are not in this game" };
  if (caster.isEliminated) return { error: "Eliminated players cannot vote" };

  // Check if already voted
  const existingVote = await db.vote.findFirst({
    where: { gameId, casterId: caster.id },
  });
  if (existingVote) return { error: "You have already voted" };

  // Get target gamePlayer
  let targetGamePlayerId: string | null = null;
  if (targetUserId) {
    const targetPlayer = game.players.find((p) => p.userId === targetUserId);
    if (!targetPlayer) return { error: "Target player not found" };
    targetGamePlayerId = targetPlayer.id;
  }

  // Check ability: double_vote
  const isDouble = caster.ability === "double_vote" && !caster.abilityUsed;

  await db.vote.create({
    data: {
      gameId,
      casterId: caster.id,
      targetId: targetGamePlayerId,
      isDouble,
    },
  });

  if (isDouble) {
    await db.gamePlayer.update({
      where: { id: caster.id },
      data: { abilityUsed: true },
    });
  }

  // Update room timestamp
  await db.room.update({
    where: { id: game.roomId },
    data: { updatedAt: new Date() },
  });

  // Check if all players have voted
  const activePlayers = game.players.filter((p) => !p.isEliminated);
  const votes = await db.vote.findMany({ where: { gameId } });

  if (votes.length >= activePlayers.length) {
    // Auto-reveal
    await revealResults(gameId);
  }

  return { success: true };
}

export async function revealResults(gameId: string) {
  const game = await db.game.findUnique({
    where: { id: gameId },
    include: {
      players: { include: { user: true } },
      votes: true,
      room: true,
    },
  });

  if (!game) return { error: "Game not found" };
  if (game.status === "revealing" || game.status === "finished") return { success: true };

  const votes = game.votes.map((v) => ({
    casterId: v.casterId,
    targetId: v.targetId,
    isDouble: v.isDouble,
  }));

  const playerIds = game.players.map((p) => p.id);
  const { eliminatedId, isTie, voteCounts } = calculateVotes(votes, playerIds);

  // Find eliminated user
  const eliminatedPlayer = eliminatedId
    ? game.players.find((p) => p.id === eliminatedId)
    : null;

  // Mark eliminated
  if (eliminatedPlayer) {
    await db.gamePlayer.update({
      where: { id: eliminatedPlayer.id },
      data: { isEliminated: true },
    });
  }

  // Check game outcome
  const impostors = game.players.filter(
    (p) => p.role === "impostor" || p.role === "double_agent"
  );
  const impostorsCaught = eliminatedPlayer
    ? impostors.some((i) => i.id === eliminatedPlayer.id)
    : false;

  const remainingImpostors = impostors.filter(
    (i) => i.id !== eliminatedPlayer?.id && !i.isEliminated
  );
  const remainingInnocents = game.players.filter(
    (p) =>
      p.role === "innocent" &&
      p.id !== eliminatedPlayer?.id &&
      !p.isEliminated
  );

  const impostorsWin =
    remainingImpostors.length >= remainingInnocents.length;
  const outcome = impostorsCaught
    ? "impostors_caught"
    : impostorsWin
    ? "impostors_win"
    : "no_elimination";

  // Calculate rewards
  const dailyEvent = game.dailyEventId
    ? await db.dailyEvent.findUnique({ where: { id: game.dailyEventId } })
    : null;
  const multiplier = dailyEvent ? dailyEvent.multiplier : 1;

  const playerRewards = calculateXPRewards(
    game.players.map((p) => ({
      userId: p.userId,
      displayName: p.user.displayName,
      role: p.role as "innocent" | "impostor" | "double_agent",
      isEliminated: p.isEliminated,
    })),
    eliminatedPlayer?.userId ?? null,
    impostorsWin,
    multiplier
  );

  // Update player stats and XP
  for (const reward of playerRewards) {
    const user = await db.user.findUnique({ where: { id: reward.userId } });
    if (!user) continue;

    const newXP = user.xp + reward.xp;
    const { level } = calculateLevelFromXP(newXP);

    const gp = game.players.find((p) => p.userId === reward.userId);
    const isImpostor = gp?.role === "impostor" || gp?.role === "double_agent";
    const won =
      (isImpostor && impostorsWin) || (!isImpostor && !impostorsWin);

    await db.user.update({
      where: { id: reward.userId },
      data: {
        xp: newXP,
        coins: { increment: reward.coins },
        level,
        totalGames: { increment: 1 },
        gamesWon: won ? { increment: 1 } : undefined,
        timesImpostor: isImpostor ? { increment: 1 } : undefined,
        impostorWins: isImpostor && won ? { increment: 1 } : undefined,
        correctGuesses:
          !isImpostor && eliminatedPlayer && impostors.some((i) => i.id === eliminatedPlayer.id)
            ? { increment: 1 }
            : undefined,
      },
    });

    await db.gamePlayer.updateMany({
      where: { gameId, userId: reward.userId },
      data: { xpEarned: reward.xp, coinsEarned: reward.coins },
    });
  }

  // Update game status
  await db.game.update({
    where: { id: gameId },
    data: {
      status: "revealing",
      revealedAt: new Date(),
    },
  });

  await db.room.update({
    where: { id: game.roomId },
    data: { updatedAt: new Date() },
  });

  return { success: true, outcome, eliminatedUserId: eliminatedPlayer?.userId };
}

export async function finishGame(gameId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const game = await db.game.findUnique({
    where: { id: gameId },
    include: { room: true },
  });

  if (!game) return { error: "Game not found" };
  if (game.room.hostId !== session.user.id) return { error: "Only host can finish game" };

  await db.game.update({
    where: { id: gameId },
    data: { status: "finished", finishedAt: new Date() },
  });

  await db.room.update({
    where: { id: game.roomId },
    data: {
      status: "lobby",
      currentGameId: null,
      updatedAt: new Date(),
    },
  });

  return { success: true };
}

export async function useAbility(
  gameId: string,
  abilityType: string,
  targetUserId?: string
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const game = await db.game.findUnique({
    where: { id: gameId },
    include: { players: true },
  });

  if (!game) return { error: "Game not found" };

  const caster = game.players.find((p) => p.userId === session.user.id);
  if (!caster) return { error: "Not in this game" };
  if (caster.abilityUsed) return { error: "Ability already used" };
  if (caster.ability !== abilityType) return { error: "You don't have this ability" };

  await db.gamePlayer.update({
    where: { id: caster.id },
    data: {
      abilityUsed: true,
      abilityTarget: targetUserId ?? null,
    },
  });

  await db.room.update({
    where: { id: game.roomId },
    data: { updatedAt: new Date() },
  });

  return { success: true };
}
