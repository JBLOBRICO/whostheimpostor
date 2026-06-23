import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ShopClient } from "@/components/shop/shop-client";

export default async function ShopPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      ownedCosmetics: { include: { cosmetic: true } },
    },
  });

  if (!user) redirect("/login");

  return (
    <ShopClient
      userCoins={user.coins}
      userLevel={user.level}
      ownedCosmeticKeys={user.ownedCosmetics.map((oc) => oc.cosmetic.key)}
    />
  );
}
