import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { GameRoom } from "@/components/room/game-room";

interface RoomPageProps {
  params: Promise<{ code: string }>;
}

export default async function RoomPage({ params }: RoomPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { code } = await params;

  // FIX: use _count for accurate player count, don't filter by userId
  const room = await db.room.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      _count: { select: { players: true } },
    },
  });

  if (!room) redirect("/dashboard");

  // Check if already in room
  const existingPlayer = await db.roomPlayer.findUnique({
    where: { roomId_userId: { roomId: room.id, userId: session.user.id } },
  });

  if (!existingPlayer) {
    // Room not joinable during active game
    if (room.status !== "lobby") redirect("/dashboard");

    // FIX: use accurate count for capacity check
    if (room._count.players >= room.maxPlayers) redirect("/dashboard");

    // Leave any other rooms first
    await db.roomPlayer.deleteMany({ where: { userId: session.user.id } });

    await db.roomPlayer.create({
      data: { roomId: room.id, userId: session.user.id, isHost: false, isReady: false },
    });

    await db.room.update({ where: { id: room.id }, data: { updatedAt: new Date() } });
  }

  return (
    <GameRoom
      roomId={room.id}
      roomCode={code.toUpperCase()}
      currentUserId={session.user.id}
    />
  );
}
