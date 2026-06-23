import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { RoomState, GameState, PlayerProfile, GamePlayerState } from "@/types/game";
import { ALL_TWISTS } from "@/lib/game-data/twists";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomId } = await params;

  try {
    const room = await db.room.findUnique({
      where: { id: roomId },
      include: {
        players: {
          include: { user: true },
          orderBy: { joinedAt: "asc" },
        },
        games: {
          where: { id: { not: undefined } },
          orderBy: { startedAt: "desc" },
          take: 1,
          include: {
            players: {
              include: { user: true },
              orderBy: { speakingOrder: "asc" },
            },
            votes: true,
          },
        },
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Check if user is in room
    const isInRoom = room.players.some((p) => p.userId === session.user.id);
    if (!isInRoom) {
      return NextResponse.json({ error: "Not in room" }, { status: 403 });
    }

    const currentGame = room.games[0];

    // Build player profiles
    const players: PlayerProfile[] = room.players.map((rp) => ({
      id: rp.id,
      userId: rp.userId,
      username: rp.user.username,
      displayName: rp.user.displayName,
      level: rp.user.level,
      avatar: rp.user.equippedAvatar,
      border: rp.user.equippedBorder,
      title: rp.user.equippedTitle,
      emote: rp.user.equippedEmote,
      voteEffect: rp.user.equippedVoteEffect,
      isHost: rp.isHost,
      isReady: rp.isReady,
    }));

    // Build game state (hide secret info)
    let gameState: GameState | undefined;
    if (currentGame && (currentGame.status !== "finished")) {
      const gamePlayers: GamePlayerState[] = currentGame.players.map((gp) => {
        const isMe = gp.userId === session.user.id;
        const isReveal = currentGame.status === "revealing";
        const isHost = room.hostId === session.user.id;

        // Count votes received
        const votesReceived = currentGame.votes.filter((v) => v.targetId === gp.id).length;

        return {
          id: gp.id,
          userId: gp.userId,
          displayName: gp.user.displayName,
          avatar: gp.user.equippedAvatar,
          border: gp.user.equippedBorder,
          title: gp.user.equippedTitle,
          // Only reveal role/word to the player themselves, or on reveal phase
          role: isMe || isReveal ? (gp.role as "innocent" | "impostor" | "double_agent") : undefined,
          wordShown: isMe ? gp.wordShown ?? undefined : undefined,
          ability: isMe ? (gp.ability as "reveal_category" | "skip_vote" | "double_vote" | "force_first" | "protect_self" | "cancel_ability" | "swap_votes" | "freeze_timer" | "trigger_revote" | "view_word_category" | "force_random_first" | undefined) : undefined,
          abilityUsed: gp.abilityUsed,
          isEliminated: gp.isEliminated,
          speakingOrder: gp.speakingOrder ?? undefined,
          hasVoted: isHost || isReveal
            ? currentGame.votes.some((v) => v.casterId === gp.id)
            : undefined,
          votesReceived: isReveal ? votesReceived : undefined,
        };
      });

      const twist = currentGame.activeTwist
        ? ALL_TWISTS[currentGame.activeTwist as keyof typeof ALL_TWISTS]
        : undefined;

      // Build twist data (hide sensitive twist data from non-host during game)
      const twistData = currentGame.twistData
        ? JSON.parse(currentGame.twistData as string)
        : {};

      // Reveal secret data during/after reveal
      let revealData = undefined;
      if (currentGame.status === "revealing") {
        revealData = {
          secretWord: currentGame.secretWord!,
          category: currentGame.category!,
          twist: twist ?? null,
          players: currentGame.players.map((gp) => ({
            userId: gp.userId,
            displayName: gp.user.displayName,
            role: gp.role as import("@/types/game").PlayerRole,
            wordShown: gp.wordShown,
            ability: gp.ability as import("@/types/game").AbilityType | null,
            abilityUsed: gp.abilityUsed,
          })),
          eliminatedPlayer: currentGame.players.find((p) => p.isEliminated)?.userId ?? null,
          outcome: determineOutcome(currentGame.players),
          stats: {},
          xpBreakdown: currentGame.players.map((gp) => ({
            userId: gp.userId,
            displayName: gp.user.displayName,
            xp: gp.xpEarned,
            coins: gp.coinsEarned,
            reasons: [],
          })),
        };
      }

      gameState = {
        id: currentGame.id,
        roomId: currentGame.roomId,
        roundNumber: currentGame.roundNumber,
        status: currentGame.status as "assigning" | "discussion" | "voting" | "revealing" | "finished",
        category: currentGame.status !== "assigning" ? currentGame.category ?? undefined : undefined,
        activeTwist: twist,
        players: gamePlayers,
        discussionStartedAt: currentGame.discussionStartedAt?.getTime(),
        votingStartedAt: currentGame.votingStartedAt?.getTime(),
        discussionTimeLimit: room.discussionTime,
        votingTimeLimit: room.votingTime,
        revealData,
        wordMutated: twistData.wordMutated ?? false,
      };
    }

    const roomState: RoomState = {
      id: room.id,
      code: room.code,
      hostId: room.hostId,
      name: room.name,
      status: room.status as "lobby" | "playing" | "finished",
      settings: {
        discussionTime: room.discussionTime,
        votingTime: room.votingTime,
        numImpostors: room.numImpostors,
        anonymousVoting: room.anonymousVoting,
        enableAbilities: room.enableAbilities,
        enableTwists: room.enableTwists,
        enabledTwists: room.enabledTwists
          ? JSON.parse(room.enabledTwists as string)
          : [],
        gameMode: room.gameMode as "classic" | "chaos" | "ranked" | "custom",
        maxPlayers: room.maxPlayers,
      },
      players,
      currentGame: gameState,
      updatedAt: room.updatedAt.getTime(),
    };

    return NextResponse.json({ roomState, timestamp: Date.now() });
  } catch (err) {
    console.error("Room state error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function determineOutcome(
  players: Array<{ role: string; isEliminated: boolean }>
): "impostors_caught" | "impostors_win" | "no_elimination" {
  const eliminated = players.filter((p) => p.isEliminated);
  if (eliminated.length === 0) return "no_elimination";

  const impostorEliminated = eliminated.some(
    (p) => p.role === "impostor" || p.role === "double_agent"
  );
  if (impostorEliminated) return "impostors_caught";

  const remainingImpostors = players.filter(
    (p) => (p.role === "impostor" || p.role === "double_agent") && !p.isEliminated
  );
  const remainingInnocents = players.filter(
    (p) => p.role === "innocent" && !p.isEliminated
  );

  if (remainingImpostors.length >= remainingInnocents.length) return "impostors_win";
  return "no_elimination";
}
