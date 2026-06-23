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

  const room = await db.room.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      players: {
        where: { userId: session.user.id },
      },
    },
  });

  if (!room) redirect("/dashboard");

  // Auto-join if not already in room
  if (room.players.length === 0) {
    if (room.status !== "lobby") redirect("/dashboard");
    if (room.players.length >= room.maxPlayers) redirect("/dashboard");

    await db.roomPlayer.upsert({
      where: { roomId_userId: { roomId: room.id, userId: session.user.id } },
      create: { roomId: room.id, userId: session.user.id, isHost: false, isReady: false },
      update: {},
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
