import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";

const messageSchema = z.object({
  content: z.string().min(1).max(200),
  type: z.enum(["text", "emoji", "system", "quick_chat"]).default("text"),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomId } = await params;
  const since = request.nextUrl.searchParams.get("since");

  // FIX: since param validation
  let sinceDate: Date | undefined;
  if (since) {
    const ts = parseInt(since, 10);
    if (!isNaN(ts) && ts > 0) sinceDate = new Date(ts);
  }

  try {
    const messages = await db.message.findMany({
      where: {
        roomId,
        ...(sinceDate ? { createdAt: { gt: sinceDate } } : {}),
      },
      include: { user: true },
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    return NextResponse.json({
      messages: messages.map((m) => ({
        id: m.id,
        userId: m.userId,
        displayName: m.user.displayName,
        avatar: m.user.equippedAvatar,
        content: m.content,
        type: m.type,
        createdAt: m.createdAt.getTime(),
      })),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomId } = await params;

  try {
    const body = await request.json();
    const parsed = messageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }

    // Check if user is in room
    const roomPlayer = await db.roomPlayer.findUnique({
      where: { roomId_userId: { roomId, userId: session.user.id } },
    });
    if (!roomPlayer) {
      return NextResponse.json({ error: "Not in room" }, { status: 403 });
    }

    // Rate limiting: max 1 message per 500ms
    const recentMessage = await db.message.findFirst({
      where: {
        roomId,
        userId: session.user.id,
        createdAt: { gt: new Date(Date.now() - 500) },
      },
    });
    if (recentMessage) {
      return NextResponse.json({ error: "Rate limited" }, { status: 429 });
    }

    // Check if muted (mute_curse twist)
    const currentGame = await db.room.findUnique({
      where: { id: roomId },
      select: { currentGameId: true },
    });

    if (currentGame?.currentGameId) {
      const game = await db.game.findUnique({
        where: { id: currentGame.currentGameId },
        select: { twistData: true, activeTwist: true, status: true },
      });

      if (game?.activeTwist === "mute_curse" && game.status === "discussion") {
        const twistData = game.twistData ? JSON.parse(game.twistData as string) : {};
        if (twistData.mutedPlayerId === session.user.id) {
          return NextResponse.json({ error: "You are muted!" }, { status: 403 });
        }
      }

      if (game?.activeTwist === "silent_round" && game.status === "discussion") {
        // Block both text AND quick_chat during silent rounds
        if (parsed.data.type === "text" || parsed.data.type === "quick_chat") {
          return NextResponse.json(
            { error: "Silent Round — emojis only!" },
            { status: 403 }
          );
        }
      }
    }

    const message = await db.message.create({
      data: {
        roomId,
        userId: session.user.id,
        content: parsed.data.content,
        type: parsed.data.type,
      },
      include: { user: true },
    });

    // Touch room updatedAt
    await db.room.update({ where: { id: roomId }, data: { updatedAt: new Date() } });

    return NextResponse.json({
      message: {
        id: message.id,
        userId: message.userId,
        displayName: message.user.displayName,
        avatar: message.user.equippedAvatar,
        content: message.content,
        type: message.type,
        createdAt: message.createdAt.getTime(),
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
