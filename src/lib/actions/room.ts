"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { generateRoomCode } from "@/lib/utils";
import { z } from "zod";
import { GameMode, TwistType } from "@/types/game";

const createRoomSchema = z.object({
  name: z.string().min(1).max(30).default("Game Room"),
  gameMode: z.enum(["classic", "chaos", "ranked", "custom"]).default("classic"),
  maxPlayers: z.number().min(4).max(12).default(8),
  discussionTime: z.number().min(30).max(300).default(120),
  votingTime: z.number().min(15).max(120).default(60),
  numImpostors: z.number().min(1).max(3).default(1),
  anonymousVoting: z.boolean().default(false),
  enableAbilities: z.boolean().default(true),
  enableTwists: z.boolean().default(true),
});

export async function createRoom(formData: FormData | Record<string, unknown>) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be logged in to create a room." };
  }

  const rawData = formData instanceof FormData
    ? Object.fromEntries(formData.entries())
    : formData;

  const parsed = createRoomSchema.safeParse({
    name: rawData.name ?? "Game Room",
    gameMode: rawData.gameMode ?? "classic",
    maxPlayers: Number(rawData.maxPlayers ?? 8),
    discussionTime: Number(rawData.discussionTime ?? 120),
    votingTime: Number(rawData.votingTime ?? 60),
    numImpostors: Number(rawData.numImpostors ?? 1),
    anonymousVoting: rawData.anonymousVoting === true || rawData.anonymousVoting === "true",
    enableAbilities: rawData.enableAbilities !== false && rawData.enableAbilities !== "false",
    enableTwists: rawData.enableTwists !== false && rawData.enableTwists !== "false",
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const settings = parsed.data;

  // Generate unique room code
  let code = generateRoomCode();
  let attempts = 0;
  while (await db.room.findUnique({ where: { code } }) && attempts < 10) {
    code = generateRoomCode();
    attempts++;
  }

  try {
    // Leave any existing rooms
    await db.roomPlayer.deleteMany({
      where: { userId: session.user.id },
    });

    const room = await db.room.create({
      data: {
        code,
        hostId: session.user.id,
        name: settings.name,
        gameMode: settings.gameMode,
        maxPlayers: settings.maxPlayers,
        discussionTime: settings.discussionTime,
        votingTime: settings.votingTime,
        numImpostors: settings.numImpostors,
        anonymousVoting: settings.anonymousVoting,
        enableAbilities: settings.enableAbilities,
        enableTwists: settings.enableTwists,
        players: {
          create: {
            userId: session.user.id,
            isHost: true,
            isReady: true,
          },
        },
      },
    });

    return { success: true, roomCode: room.code, roomId: room.id };
  } catch {
    return { error: "Failed to create room. Please try again." };
  }
}

export async function joinRoom(code: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be logged in to join a room." };
  }

  const normalizedCode = code.toUpperCase().trim();

  try {
    const room = await db.room.findUnique({
      where: { code: normalizedCode },
      include: { players: true },
    });

    if (!room) {
      return { error: "Room not found. Check the code and try again." };
    }

    if (room.status !== "lobby") {
      return { error: "This game is already in progress." };
    }

    if (room.players.length >= room.maxPlayers) {
      return { error: "This room is full." };
    }

    // Check if already in room
    const existing = room.players.find((p) => p.userId === session.user.id);
    if (existing) {
      return { success: true, roomCode: room.code, roomId: room.id };
    }

    // Leave other rooms
    await db.roomPlayer.deleteMany({
      where: { userId: session.user.id },
    });

    await db.roomPlayer.create({
      data: {
        roomId: room.id,
        userId: session.user.id,
        isHost: false,
        isReady: false,
      },
    });

    // Update room timestamp
    await db.room.update({
      where: { id: room.id },
      data: { updatedAt: new Date() },
    });

    return { success: true, roomCode: room.code, roomId: room.id };
  } catch {
    return { error: "Failed to join room. Please try again." };
  }
}

export async function leaveRoom(roomId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  try {
    const roomPlayer = await db.roomPlayer.findUnique({
      where: {
        roomId_userId: { roomId, userId: session.user.id },
      },
    });

    if (!roomPlayer) return { success: true };

    await db.roomPlayer.delete({
      where: { roomId_userId: { roomId, userId: session.user.id } },
    });

    // Check if room needs a new host
    const remainingPlayers = await db.roomPlayer.findMany({
      where: { roomId },
      orderBy: { joinedAt: "asc" },
    });

    if (remainingPlayers.length === 0) {
      // Delete empty room
      await db.room.delete({ where: { id: roomId } });
    } else if (roomPlayer.isHost && remainingPlayers.length > 0) {
      // Migrate host
      await db.roomPlayer.update({
        where: { id: remainingPlayers[0].id },
        data: { isHost: true },
      });
      await db.room.update({
        where: { id: roomId },
        data: { hostId: remainingPlayers[0].userId, updatedAt: new Date() },
      });
    } else {
      await db.room.update({
        where: { id: roomId },
        data: { updatedAt: new Date() },
      });
    }

    return { success: true };
  } catch {
    return { error: "Failed to leave room." };
  }
}

export async function updateRoomSettings(
  roomId: string,
  settings: Partial<{
    discussionTime: number;
    votingTime: number;
    numImpostors: number;
    anonymousVoting: boolean;
    enableAbilities: boolean;
    enableTwists: boolean;
    enabledTwists: TwistType[];
    maxPlayers: number;
    gameMode: GameMode;
    name: string;
  }>
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const room = await db.room.findUnique({ where: { id: roomId } });
  if (!room || room.hostId !== session.user.id) {
    return { error: "Only the host can update settings." };
  }

  try {
    await db.room.update({
      where: { id: roomId },
      data: {
        ...settings,
        enabledTwists: settings.enabledTwists
          ? JSON.stringify(settings.enabledTwists)
          : undefined,
        updatedAt: new Date(),
      },
    });
    return { success: true };
  } catch {
    return { error: "Failed to update settings." };
  }
}

export async function setPlayerReady(roomId: string, isReady: boolean) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  try {
    await db.roomPlayer.update({
      where: { roomId_userId: { roomId, userId: session.user.id } },
      data: { isReady },
    });
    await db.room.update({ where: { id: roomId }, data: { updatedAt: new Date() } });
    return { success: true };
  } catch {
    return { error: "Failed to update ready status." };
  }
}

export async function kickPlayer(roomId: string, targetUserId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const room = await db.room.findUnique({ where: { id: roomId } });
  if (!room || room.hostId !== session.user.id) {
    return { error: "Only the host can kick players." };
  }

  try {
    await db.roomPlayer.delete({
      where: { roomId_userId: { roomId, userId: targetUserId } },
    });
    await db.room.update({ where: { id: roomId }, data: { updatedAt: new Date() } });
    return { success: true };
  } catch {
    return { error: "Failed to kick player." };
  }
}
