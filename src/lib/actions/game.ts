"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { setupGame, calculateVotes, calculateXPRewards } from "@/lib/game-engine";
import { TwistType } from "@/types/game";
import { calculateLevelFromXP, shuffleArray } from "@/lib/utils";

export async function startGame(roomId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const room = await db.room.findUnique({
    where: { id: roomId },
    include: {
      players: { include: { user: true }, orderBy: { joinedAt: "asc" } },
      _count: { select: { players: true } },
    },
  });

  if (!room) return { error: "Room not found" };
  if (room.hostId !== session.user.id) return { error: "Only the host can start the game" };
  if (room.status !== "lobby") return { error: "Game already in progress" };
  if (room._count.players < 4) return { error: "Need at least 4 players to start" };

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

  // Assign speaking order — shuffled so it's random each round
  const speakingOrder = shuffleArray(playerIds);

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
        ...(dailyEvent ? { dailyEventId: dailyEvent.id } : {}),
        players: {
          create: setup.assignments.map((a) => ({
            userId: a.userId,
            role: a.role,
            wordShown: a.wordShown ?? null,
            ability: a.ability ?? null,
            speakingOrder: speakingOrder.indexOf(a.userId),
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
  if (game.room.hostId !== session.user.id) return { error: "Only the host can start discussion" };
  if (game.status !== "assigning") return { error: "Cannot start discussion now" };

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
  if (game.room.hostId !== session.user.id) return { error: "Only the host can start voting" };
  if (game.status !== "discussion") return { error: "Cannot start voting now" };

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
    include: { players: true, room: true },
  });

  if (!game || game.status !== "voting") return { error: "Voting is not active" };

  const caster = game.players.find((p) => p.userId === session.user.id);
  if (!caster) return { error: "You are not in this game" };
  if (caster.isEliminated) return { error: "Eliminated players cannot vote" };

  const existingVote = await db.vote.findFirst({
    where: { gameId, casterId: caster.id },
  });
  if (existingVote) return { error: "You have already voted" };

  let targetGamePlayerId: string | null = null;
  if (targetUserId) {
    const targetPlayer = game.players.find((p) => p.userId === targetUserId);
    if (!targetPlayer) return { error: "Target player not found" };
    if (targetPlayer.isEliminated) return { error: "Cannot vote for an eliminated player" };
    targetGamePlayerId = targetPlayer.id;
  }

  const isDouble = caster.ability === "double_vote" && !caster.abilityUsed;

  await db.vote.create({
    data: { gameId, casterId: caster.id, targetId: targetGamePlayerId, isDouble },
  });

  if (isDouble) {
    await db.gamePlayer.update({
      where: { id: caster.id },
      data: { abilityUsed: true },
    });
  }

  await db.room.update({ where: { id: game.roomId }, data: { updatedAt: new Date() } });

  // Check if all active players have voted
  const allVotes = await db.vote.findMany({ where: { gameId } });
  const activePlayers = game.players.filter((p) => !p.isEliminated);
  const voterIds = new Set(allVotes.map((v) => v.casterId));
  const allVoted = activePlayers.every((p) => voterIds.has(p.id));

  if (allVoted) {
    await _revealResults(gameId);
  }

  return { success: true };
}

async function _revealResults(gameId: string) {
  const game = await db.game.findUnique({
    where: { id: gameId },
    include: {
      players: { include: { user: true } },
      votes: true,
      room: true,
    },
  });

  if (!game) return;
  if (game.status === "revealing" || game.status === "finished") return;

  const votes = game.votes.map((v) => ({
    casterId: v.casterId,
    targetId: v.targetId,
    isDouble: v.isDouble,
  }));

  const playerIds = game.players.map((p) => p.id);
  const { eliminatedId } = calculateVotes(votes, playerIds);

  const eliminatedPlayer = eliminatedId
    ? game.players.find((p) => p.id === eliminatedId)
    : null;

  if (eliminatedPlayer) {
    await db.gamePlayer.update({
      where: { id: eliminatedPlayer.id },
      data: { isEliminated: true },
    });
  }

  const impostors = game.players.filter(
    (p) => p.role === "impostor" || p.role === "double_agent"
  );
  const eliminatedUserId = eliminatedPlayer?.userId;
  const remainingImpostors = impostors.filter(
    (i) => i.userId !== eliminatedUserId && !i.isEliminated
  );
  const remainingInnocents = game.players.filter(
    (p) => p.role === "innocent" && p.userId !== eliminatedUserId && !p.isEliminated
  );
  const impostorsWin = remainingImpostors.length >= remainingInnocents.length;

  const dailyEvent = game.dailyEventId
    ? await db.dailyEvent.findUnique({ where: { id: game.dailyEventId } })
    : null;
  const multiplier = dailyEvent?.multiplier ?? 1;

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

  for (const reward of playerRewards) {
    const user = await db.user.findUnique({ where: { id: reward.userId } });
    if (!user) continue;
    const newXP = user.xp + reward.xp;
    const { level } = calculateLevelFromXP(newXP);
    const gp = game.players.find((p) => p.userId === reward.userId);
    const isImpostor = gp?.role === "impostor" || gp?.role === "double_agent";
    const won = (isImpostor && impostorsWin) || (!isImpostor && !impostorsWin);
    const madeCorrectGuess =
      !isImpostor && eliminatedPlayer && impostors.some((i) => i.id === eliminatedPlayer.id);

    await db.user.update({
      where: { id: reward.userId },
      data: {
        xp: newXP, coins: { increment: reward.coins }, level,
        totalGames: { increment: 1 },
        ...(won ? { gamesWon: { increment: 1 } } : {}),
        ...(isImpostor ? { timesImpostor: { increment: 1 } } : {}),
        ...(isImpostor && won ? { impostorWins: { increment: 1 } } : {}),
        ...(madeCorrectGuess ? { correctGuesses: { increment: 1 } } : {}),
      },
    });

    await db.gamePlayer.updateMany({
      where: { gameId, userId: reward.userId },
      data: { xpEarned: reward.xp, coinsEarned: reward.coins },
    });
  }

  // Clean up old messages
  const msgCount = await db.message.count({ where: { roomId: game.roomId } });
  if (msgCount > 100) {
    const oldest = await db.message.findMany({
      where: { roomId: game.roomId },
      orderBy: { createdAt: "asc" },
      take: msgCount - 100,
      select: { id: true },
    });
    await db.message.deleteMany({ where: { id: { in: oldest.map((m) => m.id) } } });
  }

  await db.game.update({
    where: { id: gameId },
    data: { status: "revealing", revealedAt: new Date() },
  });

  await db.room.update({
    where: { id: game.roomId },
    data: { updatedAt: new Date() },
  });
}

export async function revealResults(gameId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };
  const game = await db.game.findUnique({ where: { id: gameId }, include: { room: true } });
  if (!game) return { error: "Game not found" };
  if (game.room.hostId !== session.user.id) return { error: "Only host can reveal results" };
  await _revealResults(gameId);
  return { success: true };
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
    data: { status: "lobby", currentGameId: null, updatedAt: new Date() },
  });

  return { success: true };
}

export async function useAbility(gameId: string, abilityType: string, targetUserId?: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const game = await db.game.findUnique({
    where: { id: gameId },
    include: { players: true },
  });

  if (!game) return { error: "Game not found" };
  if (game.status !== "discussion" && game.status !== "voting") {
    return { error: "Abilities can only be used during discussion or voting" };
  }

  const caster = game.players.find((p) => p.userId === session.user.id);
  if (!caster) return { error: "Not in this game" };
  if (caster.abilityUsed) return { error: "Ability already used" };
  if (caster.ability !== abilityType) return { error: "You don't have this ability" };
  if (abilityType === "double_vote") {
    return { error: "Double Vote activates automatically when you cast your vote" };
  }

  await db.gamePlayer.update({
    where: { id: caster.id },
    data: { abilityUsed: true, abilityTarget: targetUserId ?? null },
  });

  await db.room.update({ where: { id: game.roomId }, data: { updatedAt: new Date() } });
  return { success: true };
}
