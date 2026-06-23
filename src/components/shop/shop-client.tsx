"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { purchaseCosmetic } from "@/lib/actions/profile";
import { useToast } from "@/hooks/use-toast";
import { AVATARS, BORDERS, TITLES, EMOTES, VOTE_EFFECTS, RARITY_COLORS, RARITY_BG } from "@/lib/game-data/cosmetics";
import { ArrowLeft, Coins, Lock, Check, ShoppingCart } from "lucide-react";

interface ShopClientProps {
  userCoins: number;
  userLevel: number;
  ownedCosmeticKeys: string[];
}

type ShopTab = "avatars" | "borders" | "titles" | "emotes" | "vote_effects";

const TAB_DATA = {
  avatars: { label: "Avatars", items: AVATARS, type: "avatar" },
  borders: { label: "Borders", items: BORDERS, type: "border" },
  titles: { label: "Titles", items: TITLES, type: "title" },
  emotes: { label: "Emotes", items: EMOTES, type: "emote" },
  vote_effects: { label: "Vote Effects", items: VOTE_EFFECTS, type: "vote_effect" },
};

export function ShopClient({ userCoins, userLevel, ownedCosmeticKeys }: ShopClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [tab, setTab] = useState<ShopTab>("avatars");
  const [coins, setCoins] = useState(userCoins);
  const [owned, setOwned] = useState(new Set(ownedCosmeticKeys));
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [confirmItem, setConfirmItem] = useState<{ key: string; name: string; cost: number; type: string } | null>(null);

  async function handlePurchase(key: string, type: string, cost: number, name: string) {
    if (owned.has(key)) return;
    setConfirmItem({ key, name, cost, type });
  }

  async function confirmPurchase() {
    if (!confirmItem) return;
    setPurchasing(confirmItem.key);
    setConfirmItem(null);

    try {
      const result = await purchaseCosmetic(confirmItem.key, confirmItem.type);
      if (result.error) {
        toast({ title: "Purchase Failed", description: result.error, variant: "destructive" });
      } else {
        setCoins((c) => c - confirmItem.cost);
        setOwned((s) => new Set([...s, confirmItem.key]));
        toast({
          title: "Purchased!",
          description: `${confirmItem.name} is now yours!`,
          variant: "success",
        });
      }
    } finally {
      setPurchasing(null);
    }
  }

  const currentTab = TAB_DATA[tab];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass border-b border-white/10 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon-sm" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="font-bold text-white flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-purple-400" />
              Cosmetic Shop
            </h1>
          </div>
          <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-3 py-1.5">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="font-bold text-yellow-300">{coins.toLocaleString()}</span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <p className="text-white/40 text-sm mb-6 text-center">
          All items are purely cosmetic — no gameplay advantages, ever!
        </p>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-6 overflow-x-auto">
          {(Object.keys(TAB_DATA) as ShopTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 min-w-fit py-2 px-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                tab === t ? "bg-purple-600 text-white" : "text-white/50 hover:text-white/70"
              }`}
            >
              {TAB_DATA[t].label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {currentTab.items.map((item, i) => {
            const isOwned = item.coinCost === 0 || owned.has(item.key);
            const isLocked = userLevel < item.levelRequired;
            const canAfford = coins >= item.coinCost;
            const isPurchasing = purchasing === item.key;

            return (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                className={`glass-card p-4 text-center relative ${
                  isOwned ? "border-green-500/30" : ""
                } ${isLocked ? "opacity-60" : ""}`}
              >
                {/* Rarity indicator */}
                <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                  item.rarity === "legendary" ? "bg-yellow-400" :
                  item.rarity === "epic" ? "bg-purple-400" :
                  item.rarity === "rare" ? "bg-blue-400" : "bg-gray-400"
                }`} />

                <div className="text-3xl mb-2">{item.preview}</div>
                <p className="font-semibold text-white text-sm mb-1 truncate">{item.name}</p>
                <Badge
                  variant="outline"
                  className={`text-[10px] mb-3 ${RARITY_COLORS[item.rarity]} ${RARITY_BG[item.rarity]}`}
                >
                  {item.rarity}
                </Badge>

                {isOwned ? (
                  <div className="flex items-center justify-center gap-1 text-green-400 text-xs">
                    <Check className="w-3 h-3" /> Owned
                  </div>
                ) : isLocked ? (
                  <div className="flex flex-col items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-white/40" />
                    <span className="text-white/40 text-[10px]">Level {item.levelRequired}</span>
                  </div>
                ) : (
                  <Button
                    variant={canAfford ? "gold" : "outline"}
                    size="sm"
                    className="w-full text-xs"
                    disabled={!canAfford || isPurchasing}
                    loading={isPurchasing}
                    onClick={() => handlePurchase(item.key, currentTab.type, item.coinCost, item.name)}
                  >
                    <Coins className="w-3 h-3 mr-1" />
                    {item.coinCost === 0 ? "Free" : item.coinCost.toLocaleString()}
                  </Button>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Confirm modal */}
      <AnimatePresence>
        {confirmItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60"
              onClick={() => setConfirmItem(null)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative glass-card p-6 max-w-sm w-full text-center z-10"
            >
              <div className="text-4xl mb-3">🛒</div>
              <h3 className="font-bold text-white text-lg mb-2">Confirm Purchase</h3>
              <p className="text-white/60 text-sm mb-4">
                Buy <strong className="text-white">{confirmItem.name}</strong> for{" "}
                <strong className="text-yellow-400">{confirmItem.cost} coins</strong>?
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setConfirmItem(null)}>
                  Cancel
                </Button>
                <Button variant="gold" className="flex-1" onClick={confirmPurchase}>
                  Purchase!
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
